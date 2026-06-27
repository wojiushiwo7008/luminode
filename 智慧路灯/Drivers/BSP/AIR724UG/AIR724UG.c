/*
 * AIR724UG.c  (v2: 同步 AT 引擎)
 *
 *  改造要点
 *  --------
 *  1. 所有 AT 命令通过 at_send_cmd() 同步收发,等模组真正回 OK/ERROR
 *     才往下走;不再用 delay_ms(500) 盲发盲等。
 *  2. AT 应答(OK/ERROR/+CME ERROR)由 freertos_demo.c 中的 line dispatcher
 *     从 RX 字节流里挑出来,通过 atRespQueue 通知本模块。
 *  3. atBusyMutex 保证同时只有一个 AT 会话在飞;uartTxMutex 保证 TX 串行。
 *  4. shuju1() 也变成同步发布,可以返回成功/失败,由 mqtt_task 据此触发重连。
 */

#include "./BSP/AIR724UG/AIR724UG.h"
#include "./SYSTEM/usart/usart.h"
#include <string.h>
#include <stdio.h>

#include "FreeRTOS.h"
#include "task.h"

/* ====================== 云端切换宏 ======================
 *   1 = 阿里云物联网平台(默认,2026-06-17 迁移到此)
 *   0 = OneNET(原始,保留作为回滚路径)
 * 改这一行重编即可整体切换上行/下行 topic、MCONFIG 签名、MQTT host。
 */
#ifndef LUMINODE_CLOUD_ALIYUN
#define LUMINODE_CLOUD_ALIYUN 1
#endif

#if LUMINODE_CLOUD_ALIYUN
#include "./BSP/AIR724UG/aliyun_creds.h"
#endif

extern int t111;
extern int c111;
extern u32 MQ2, MQ135, WIND;
/* DC01 红外 PM2.5 原始浓度(ug/m³),在 freertos_demo.c 的 dc01_task 里更新.
 * 用作 PM25 物模型字段(0-100 范围,超 100 在上报时截断). */
extern volatile uint16_t dc01_pm25;
/* 设备执行器状态(在 freertos_demo.c 里维护,被 +MSUB 下行 set 修改)
 *   -1=未知, 0=off, 1=on
 *   未知态按 off 上报,保证云端"读写"属性卡片不显示 undefined */
extern volatile int led_state;
extern volatile int pwq_state;
extern volatile int csb_state;

/* ====================== 全局对象 ====================== */
QueueHandle_t      atRespQueue  = NULL;   /* uint8_t 元素,投递 at_resp_t */
SemaphoreHandle_t  atBusyMutex  = NULL;   /* 串行化 AT 会话 */

/* OLED 诊断面板状态(见 AIR724UG.h 注释里的编码表) */
volatile int      g_at_step  = 0;
volatile int      g_at_err   = 0;
volatile uint32_t g_pub_ok   = 0;
volatile uint32_t g_pub_fail = 0;

/* 通用 URC 等待(由 at_wait_urc 设置,dispatch_line 通过 at_urc_check_line 触发) */
static const char * volatile g_urc_match = NULL;
static SemaphoreHandle_t     g_urc_sem   = NULL;

/* ====================== 旧的兼容延时函数 ====================== */
void delay_30s(void)
{
    u8 i;
    for (i = 0; i < 20; i++)
        delay_ms(1500);
}

void delay_10s(void)
{
    u8 i;
    for (i = 0; i < 10; i++)
        delay_ms(1000);
}

/* ====================== 模组上电(PA0 → PWRKEY 经反相器) ====================== */
void AIR724UG_PowerOn(void)
{
    GPIO_InitTypeDef gpio = {0};

    /* PA0 是 GPIOA Pin0,先确保 APB2 上 GPIOA 时钟已开 */
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);

    gpio.GPIO_Mode  = GPIO_Mode_Out_PP;
    gpio.GPIO_Pin   = GPIO_Pin_0;
    gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);

    /* 拉高:经反相器后等价于把 PWRKEY 拉低,触发模组开机。
     * 之后保持高即可;真正等模组就绪在外面用 delay_10s()*2 完成。 */
    GPIO_WriteBit(GPIOA, GPIO_Pin_0, Bit_SET);
    delay_ms(1000);
    delay_ms(1000);
    GPIO_WriteBit(GPIOA, GPIO_Pin_0, Bit_RESET);
    delay_ms(1000);
    delay_ms(1000);
    GPIO_WriteBit(GPIOA, GPIO_Pin_0, Bit_SET);
}

/* ====================== AT 引擎初始化 ====================== */
void AIR724UG_AT_Init(void)
{
    if (atRespQueue == NULL)
        atRespQueue = xQueueCreate(8, sizeof(uint8_t));
    if (atBusyMutex == NULL)
        atBusyMutex = xSemaphoreCreateMutex();
    if (g_urc_sem == NULL)
        g_urc_sem = xSemaphoreCreateBinary();
}

/* ====================== 通用 URC 等待(两段式) ======================
 *  避免"先发命令后注册"导致的丢 URC 竞争:
 *    arm  → 触发 URC 的命令发送之前调用,清状态 + 登记匹配串
 *    wait → 命令发出后调用,等 sem 被 dispatch_line 给出
 */
void at_arm_urc(const char *substr)
{
    if (g_urc_sem == NULL) return;
    /* 清掉历史 sem 状态(如果存在),保证后续 wait 一定是这次 arm 之后命中的 */
    xSemaphoreTake(g_urc_sem, 0);
    g_urc_match = substr;
}

int at_wait_urc(uint32_t timeout_ms)
{
    if (g_urc_sem == NULL) return -1;
    int ok = (xSemaphoreTake(g_urc_sem, pdMS_TO_TICKS(timeout_ms)) == pdTRUE);
    g_urc_match = NULL;
    return ok ? 0 : -2;
}

void at_urc_check_line(const char *line)
{
    const char *p = g_urc_match;
    if (p != NULL && line != NULL && strstr(line, p) != NULL)
    {
        if (g_urc_sem != NULL)
            xSemaphoreGive(g_urc_sem);
    }
}

/* ====================== 核心:同步发 AT 等应答 ====================== */
int at_send_cmd(const char *cmd, at_resp_t expect, uint32_t timeout_ms)
{
    if (cmd == NULL || atRespQueue == NULL || atBusyMutex == NULL)
        return -1;

    /* 1) 独占 AT 会话 */
    if (xSemaphoreTake(atBusyMutex, pdMS_TO_TICKS(timeout_ms + 500)) != pdTRUE)
        return -2;

    /* 2) 丢掉队列里可能残留的旧应答 */
    xQueueReset(atRespQueue);

    /* 3) 独占物理 TX 写命令(uartTxMutex 是递归互斥,
     *    _write 内部也会再 take 一次,所以这里必须用递归 API) */
    if (uartTxMutex != NULL)
    {
        if (xSemaphoreTakeRecursive(uartTxMutex, pdMS_TO_TICKS(1000)) != pdTRUE)
        {
            xSemaphoreGive(atBusyMutex);
            return -3;
        }
    }
    printf("%s\r\n", cmd);
    if (uartTxMutex != NULL)
        xSemaphoreGiveRecursive(uartTxMutex);

    /* 4) 等模组回应,直到命中 expect / 收到 ERROR / 超时 */
    int ret = -4;   /* 默认超时 */
    TickType_t deadline = xTaskGetTickCount() + pdMS_TO_TICKS(timeout_ms);

    for (;;)
    {
        TickType_t now = xTaskGetTickCount();
        if ((int32_t)(deadline - now) <= 0) break;
        TickType_t remain = deadline - now;

        uint8_t resp = AT_RESP_NONE;
        if (xQueueReceive(atRespQueue, &resp, remain) != pdTRUE)
            break;  /* 超时 */

        if (resp == (uint8_t)expect)
        {
            ret = 0;
            break;
        }
        if (resp == AT_RESP_ERROR || resp == AT_RESP_CME_ERROR)
        {
            ret = -5;   /* 模组明确报错 */
            break;
        }
        /* 收到非期望的中间应答(例如等 PROMPT 但先来 OK),继续等 */
    }

    xSemaphoreGive(atBusyMutex);
    return ret;
}

/* ====================== 工具:带重试 ====================== */
static int at_try(const char *cmd, at_resp_t expect,
                  uint32_t timeout_ms, int retries)
{
    for (int i = 0; i <= retries; i++)
    {
        int r = at_send_cmd(cmd, expect, timeout_ms);
        if (r == 0) return 0;
        /* 失败/超时:稍等再试,给模组喘息时间 */
        vTaskDelay(pdMS_TO_TICKS(300));
    }
    return -1;
}

/* ====================== Ping ====================== */
int AIR724UG_Ping(void)
{
    return at_send_cmd("AT", AT_RESP_OK, 2000);
}

/* ====================== MCONFIG 长命令(凭证) ======================
 *  阿里云分支:三件套来自 aliyun_creds.h(离线生成,远期 timestamp=2050)
 *      AT+MCONFIG="<ClientID>","<Username>","<HMAC-SHA1-Password>"
 *      ClientID 形如  luminode-lamp-A24|securemode=2,signmethod=hmacsha1,timestamp=...|
 *  OneNET 分支:原 URL 编码签名,保留以便宏开关回滚。
 */
#if LUMINODE_CLOUD_ALIYUN
static const char MCONFIG_CMD[] =
    "AT+MCONFIG=\"" ALIYUN_CLIENT_ID "\",\""
                    ALIYUN_USERNAME  "\",\""
                    ALIYUN_PASSWORD  "\"";
#else
static const char MCONFIG_CMD[] =
    "AT+MCONFIG=\"Smart-street-lights\",\"K2H9tCmcp9\","
    "\"version=2018-10-31&res=products%2FK2H9tCmcp9%2Fdevices%2FSmart-street-lights"
    "&et=2053346305&method=md5&sign=Mxskoh%2BybaVzOlvMy7146w%3D%3D\"";
#endif

/* ====================== 连接到 OneNET MQTT ======================
 *  全部改为同步握手,任何一步失败立刻返回负值,让上层决定下一步动作。
 */
int AIR724UG_Mqtt_connect(void)
{
    /* 模组活着么? */
    g_at_step = 10;
    if (at_try("AT",   AT_RESP_OK, 1500, 5) != 0) { g_at_err = 1; return -1; }

    /* 关回显 + 静默(失败不致命,继续) */
    at_try("ATE0", AT_RESP_OK, 1500, 1);
    at_try("ATQ0", AT_RESP_OK, 1500, 1);
    at_try("AT&W", AT_RESP_OK, 1500, 1);

    /* 拨号 + GPRS 起来 */
    g_at_step = 30;
    if (at_try("AT+CSTT=\"\",\"\",\"\"", AT_RESP_OK, 3000, 1) != 0) { g_at_err = 2; return -2; }
    g_at_step = 40;
    if (at_try("AT+CIICR",                AT_RESP_OK, 15000, 1) != 0) { g_at_err = 3; return -3; }

    /* MQTT 三件套 */
    g_at_step = 50;
    if (at_try(MCONFIG_CMD,                       AT_RESP_OK, 3000, 1) != 0) { g_at_err = 4; return -4; }

    /* 重连场景兜底:若上一次连接残留(TCP socket 0 仍占用),MIPSTART 会回 ERROR。
     * 这里 best-effort 关一下,不管成功与否(没有连接时模组会回 ERROR,忽略即可)。
     * 注意:Air724 的实际语法可能是 "AT+MIPCLOSE" 或 "AT+MIPCLOSE=0",
     *      两种我们都试一下,匹配哪种就走哪种。 */
    g_at_step = 60;
    if (at_send_cmd("AT+MIPCLOSE=0", AT_RESP_OK, 2000) != 0)
        at_send_cmd("AT+MIPCLOSE", AT_RESP_OK, 2000);

    /* MIPSTART: 模组先回 OK 表示命令接受,然后异步上报 "+MIPRTCP: 0,CONNECT OK"
     * 表示 TCP 真正握手完成,必须等到这条才能发 MCONNECT,否则 MQTT 会 ERROR。
     *
     * 关键:先 arm URC,再发命令——避免 URC 在 OK 和 wait 之间到达被丢失。 */
    g_at_step = 65;
    at_arm_urc("CONNECT OK");
#if LUMINODE_CLOUD_ALIYUN
    if (at_try("AT+MIPSTART=\"" ALIYUN_MQTT_HOST "\",\"" ALIYUN_MQTT_PORT "\"",
                                                  AT_RESP_OK, 5000, 1) != 0)
#else
    if (at_try("AT+MIPSTART=\"mqtts.heclouds.com\",\"1883\"",
                                                  AT_RESP_OK, 5000, 1) != 0)
#endif
    {
        (void)at_wait_urc(0);   /* 立即清掉 arm 状态,避免污染下次调用 */
        g_at_err = 5;
        return -5;
    }
    g_at_step = 67;
    if (at_wait_urc(20000) != 0)                                            { g_at_err = 5; return -5; }

    /* MCONNECT: 同样,模组先回 OK,真正的 MQTT 握手成功一般会上报
     * "+MMQTT: ..." 或直接由后续 PUB 成功隐式确认。这里只要 OK 即可,
     * 后续 publish 若失败会触发 link_task 自动重连。 */
    g_at_step = 70;
    if (at_try("AT+MCONNECT=1,120",               AT_RESP_OK, 10000, 1) != 0) { g_at_err = 6; return -6; }

    g_at_err = 0;   /* 全部成功:清空最近错误码,准备 publish */
    return 0;
}

/* ====================== 订阅下行 topic ======================
 *  阿里云:
 *    上行 ACK : /sys/<pk>/<dn>/thing/event/property/post_reply
 *    下行命令 : /sys/<pk>/<dn>/thing/service/property/set
 *  OneNET(保留):
 *    上行 ACK : $sys/<pid>/<dn>/thing/property/post/reply
 *    下行命令 : $sys/<pid>/<dn>/thing/property/set
 *
 *  函数名保留 OneNET_Subscribe 以免影响 mqtt_task 调用点;实际逻辑由宏决定。
 */
int OneNET_Subscribe(void)
{
#if LUMINODE_CLOUD_ALIYUN
    g_at_step = 75;
    if (at_try("AT+MSUB=\"" ALIYUN_TOPIC_PROP_POST_REPLY "\",0",
               AT_RESP_OK, 3000, 1) != 0)
    { g_at_err = 7; return -1; }

    g_at_step = 80;
    if (at_try("AT+MSUB=\"" ALIYUN_TOPIC_PROP_SET "\",0",
               AT_RESP_OK, 3000, 1) != 0)
    { g_at_err = 8; return -2; }

    g_at_step = 90;
    g_at_err  = 0;
#else
    if (at_try(
            "AT+MSUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post/reply\",0",
            AT_RESP_OK, 3000, 1) != 0)
        return -1;

    if (at_try(
            "AT+MSUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/set\",0",
            AT_RESP_OK, 3000, 1) != 0)
        return -2;
#endif

    return 0;
}

/* ====================== 数据上报 ======================
 *  物模型 8 个属性字段(标识符 OneNET / Aliyun 保持一致以减少改动):
 *   humi int 0-100   湿度 %RH        ← AHT20 c111
 *   temp int 0-100   温度 °C         ← AHT20 t111
 *   wind int 0-10    风级            ← PC2 ADC 分桶 WIND
 *   MQ2  int 0-10    空气污染度等级   ← DC01 PM2.5 分桶后的 0-10
 *   PM25 int 0-100   PM2.5 浓度       ← DC01 原始 ug/m³,>100 截断
 *   led/pwq/csb bool                  ← 设备状态
 *
 *  阿里云 / OneNET 字段大小写敏感:MQ2 / PM25 必须大写,与平台物模型一致。
 *
 *  payload 差异(阿里云 vs OneNET):
 *    - bool 用整数 0/1(阿里云物模型 bool 接收 int)/ true/false(OneNET)
 *    - 阿里云需要 "method":"thing.event.property.post" 和 "version":"1.0"
 *    - 阿里云 topic 含 event/ 段:/sys/<pk>/<dn>/thing/event/property/post
 */
int shuju1(void)
{
    char cmd[640];

    uint16_t pm25_cap = dc01_pm25;
    if (pm25_cap > 100u) pm25_cap = 100u;        /* 物模型 0-100 范围截断 */

#if LUMINODE_CLOUD_ALIYUN
    /* 阿里云:bool → 整数 1/0;未知态(-1)按 0 上报 */
    int led_v = (led_state > 0) ? 1 : 0;
    int pwq_v = (pwq_state > 0) ? 1 : 0;
    int csb_v = (csb_state > 0) ? 1 : 0;

    int n = snprintf(cmd, sizeof(cmd),
        "AT+MPUB=\"" ALIYUN_TOPIC_PROP_POST "\",0,0,"
        "\"{\\22id\\22:\\22123\\22,\\22version\\22:\\221.0\\22,\\22params\\22:{"
        "\\22humi\\22:{\\22value\\22:%d},"
        "\\22temp\\22:{\\22value\\22:%d},"
        "\\22wind\\22:{\\22value\\22:%d},"
        "\\22MQ2\\22:{\\22value\\22:%d},"
        "\\22PM25\\22:{\\22value\\22:%d},"
        "\\22led\\22:{\\22value\\22:%d},"
        "\\22pwq\\22:{\\22value\\22:%d},"
        "\\22csb\\22:{\\22value\\22:%d}},"
        "\\22method\\22:\\22thing.event.property.post\\22}\"",
        c111, t111, (int)WIND, (int)MQ2, (int)pm25_cap,
        led_v, pwq_v, csb_v);
#else
    /* OneNET:bool → "true"/"false" 字符串 */
    const char *led_s = (led_state > 0) ? "true" : "false";
    const char *pwq_s = (pwq_state > 0) ? "true" : "false";
    const char *csb_s = (csb_state > 0) ? "true" : "false";

    int n = snprintf(cmd, sizeof(cmd),
        "AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,"
        "\"{\\22id\\22:\\22123\\22,\\22params\\22:{"
        "\\22humi\\22:{\\22value\\22:%d},"
        "\\22temp\\22:{\\22value\\22:%d},"
        "\\22wind\\22:{\\22value\\22:%d},"
        "\\22MQ2\\22:{\\22value\\22:%d},"
        "\\22PM25\\22:{\\22value\\22:%d},"
        "\\22led\\22:{\\22value\\22:%s},"
        "\\22pwq\\22:{\\22value\\22:%s},"
        "\\22csb\\22:{\\22value\\22:%s}}}\"",
        c111, t111, (int)WIND, (int)MQ2, (int)pm25_cap,
        led_s, pwq_s, csb_s);
#endif

    if (n <= 0 || n >= (int)sizeof(cmd))
    {
        g_pub_fail++;
        g_at_err = 10;
        return -10;   /* 命令被截断,放弃这次上报 */
    }

    g_at_step = 95;   /* 正在 publish */
    int r = at_send_cmd(cmd, AT_RESP_OK, 5000);
    if (r == 0)
    {
        g_pub_ok++;
        g_at_err  = 0;
    }
    else
    {
        g_pub_fail++;
        g_at_err  = 20;   /* 20 = publish 失败,区别于建链阶段 1-8 */
    }
    g_at_step = 90;
    return r;
}
