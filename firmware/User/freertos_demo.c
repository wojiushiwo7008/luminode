/**
 ****************************************************************************************************
 * @file        freertos_demo.c
 * @author      正点原子团队(ALIENTEK)
 * @version     V2.0
 * @date        2023-07-20
 * @brief       FreeRTOS 应用程序（重构：单一职责任务划分）
 ****************************************************************************************************
 */

#include "freertos_demo.h"
#include "./SYSTEM/usart/usart.h"
#include "./BSP/LED/led.h"
#include "FreeRTOS.h"
#include "task.h"
#include <stdio.h>
#include <string.h>
#include "./BSP/OLED/oled.h"
#include "./BSP/AHT20/AHT20.h"
#include "./BSP/ADC/adc.h"
#include "./BSP/AIR724UG/AIR724UG.h"
#include "./BSP/IIC/bsp_iic.h"
#include "./BSP/Timer/Timer.h"
#include "semphr.h"

/* ==============================
 *  共享数据（sensor_task 写，其他只读）
 * ============================== */
extern int t111, c111;
extern u32 MQ2, MQ135, WIND;
extern u16 adsd;                /* PA3 雨滴原始 ADC */
extern u16 adsd1, adsd2, adsd3, adsd4;  /* PA4/PA5/PC0/PC1 追光光敏原始 ADC */
extern u16 adsd5, adsd6;        /* PC2/PC3 原始 ADC(风速 + 备用) */
extern int16_t zx, yx, zs, ys;          /* 追光舵机当前角度 */

/* DC01 PM2.5: 协议解析出来的最新值(μg/m³)。在 usart.c/dc01_task 里更新 */
volatile uint16_t dc01_pm25 = 0;

/* receive_task 解析命令后设置的设备状态标志
 *   -1 = 未知(尚未被云端 set 过,上报时按 0=off 发出去,免得云端一直 undefined)
 *    0 = off
 *    1 = on
 * 不再 static,因为 AIR724UG.c 的 shuju1() 需要把这三位回传给云端
 * (OneNET 物模型的"读写"属性只下发不上报时,仪表盘永远 undefined)。 */
volatile int led_state = -1;
volatile int pwq_state = -1;
volatile int csb_state = -1;

/* link_task 维护:1=MQTT 已连上且订阅完毕,0=未连接/已掉线 */
static volatile int link_ok   = 0;

/* mqtt_task 把 link_ok 置 0 时给一下这个 sem,可以立刻唤醒 link_task,
 * 不用等 30s 心跳周期才察觉到掉线 */
static SemaphoreHandle_t linkKickSem = NULL;

/* ==============================
 *  互斥锁
 * ============================== */
SemaphoreHandle_t oledMutex   = NULL;  /* OLED I2C 总线保护 */
SemaphoreHandle_t uartTxMutex = NULL;  /* UART TX (printf) 保护 */
SemaphoreHandle_t adcMutex    = NULL;  /* ADC1 硬件保护 */

/* ==============================
 *  UART 相关（usart.c 中定义）
 * ============================== */
extern SemaphoreHandle_t uartSemaphore;
extern QueueHandle_t     uartQueue;

/* ==============================
 *  JSON 解析函数前向声明
 * ============================== */
static void handle_line_only_msub(char *line);
static void parse_msub_json_len(const char *json, size_t json_len);
static int  json_get_bool_in_obj(const char *obj, const char *field, int *out_val);
static int  extract_object_by_key_len(const char *json, size_t json_len,
                                      const char *key, char *out, size_t out_size);
static int  extract_msub_json_len(const char *line, char *out, size_t out_size,
                                  size_t *out_len);

#define LINE_BUF_SIZE 2048

/* ==============================
 *  任务配置
 * ============================== */

/* start_task: 创建所有子任务后自删 */
#define START_TASK_PRIO     1
#define START_STK_SIZE      256
TaskHandle_t StartTask_Handler;
void start_task(void *pvParameters);

/* sensor_task: AHT20 + ADC 全部传感器采集
 *   chuanganqi() 内部若有 sprintf/printf 会吃栈,256 偏紧,加到 384 保险 */
#define SENSOR_TASK_PRIO    2
#define SENSOR_STK_SIZE     384
TaskHandle_t SensorTask_Handler;
void sensor_task(void *pvParameters);

/* servo_task: 追光 ADC + 舵机控制 */
#define SERVO_TASK_PRIO     3
#define SERVO_STK_SIZE      384
TaskHandle_t ServoTask_Handler;
void servo_task(void *pvParameters);

/* display_task: 唯一操作 OLED 的任务，统一刷屏 */
#define DISPLAY_TASK_PRIO   4
#define DISPLAY_STK_SIZE    256
TaskHandle_t DisplayTask_Handler;
void display_task(void *pvParameters);

/* mqtt_task: 定时上报数据到云端
 *   shuju1() 内部 char cmd[400] + snprintf + printf 格式化, 栈消耗较大 */
#define MQTT_TASK_PRIO      5
#define MQTT_STK_SIZE       1024
TaskHandle_t MqttTask_Handler;
void mqtt_task(void *pvParameters);

/* receive_task: 接收 UART 数据，解析 MQTT 下发指令
 *   line[] 与 json[] 都是 static, 不吃栈;主要开销在 strstr/strcmp 调用 */
#define RECEIVE_TASK_PRIO   10
#define RECEIVE_STK_SIZE    512
TaskHandle_t ReceiveTask_Handler;
void receive_task(void *pvParameters);

/* link_task: 维护 MQTT 链路(初次连接 + 心跳 + 断线重连)
 *   AIR724UG_Mqtt_connect 内部也走 at_send_cmd → printf, 同样吃栈 */
#define LINK_TASK_PRIO      6
#define LINK_STK_SIZE       768
TaskHandle_t LinkTask_Handler;
void link_task(void *pvParameters);

/* dc01_task: 读 USART3 字节队列,解析 DC01 红外 PM2.5 4 字节帧 */
#define DC01_TASK_PRIO      3
#define DC01_STK_SIZE       256
TaskHandle_t Dc01Task_Handler;
void dc01_task(void *pvParameters);

/* 行解析分发:挑 +MSUB: 给 URC 处理, OK/ERROR 投到 atRespQueue */
static void dispatch_line(char *line);

/* ==============================
 *  入口
 * ============================== */
void freertos_demo(void)
{
    oledMutex   = xSemaphoreCreateMutex();
    /* uartTxMutex 用递归互斥:at_send_cmd 持锁后调用 printf,
     * printf 进入 _write 会再 take 一次同一把锁,必须递归才不死锁 */
    uartTxMutex = xSemaphoreCreateRecursiveMutex();
    adcMutex    = xSemaphoreCreateMutex();
    linkKickSem = xSemaphoreCreateBinary();

    /* 创建 AT 引擎用的 atRespQueue / atBusyMutex,
     * 必须在 vTaskStartScheduler() 之前,因为 receive_task 一启动就要往里写 */
    AIR724UG_AT_Init();

    xTaskCreate((TaskFunction_t)start_task, "start_task",
                START_STK_SIZE, NULL, START_TASK_PRIO, &StartTask_Handler);
    vTaskStartScheduler();
}

/* ==============================
 *  start_task: 创建所有子任务后自删
 * ============================== */
void start_task(void *pvParameters)
{
    taskENTER_CRITICAL();

    xTaskCreate((TaskFunction_t)sensor_task,  "sensor",
                SENSOR_STK_SIZE,  NULL, SENSOR_TASK_PRIO,  &SensorTask_Handler);

    xTaskCreate((TaskFunction_t)servo_task,   "servo",
                SERVO_STK_SIZE,   NULL, SERVO_TASK_PRIO,   &ServoTask_Handler);

    xTaskCreate((TaskFunction_t)display_task, "display",
                DISPLAY_STK_SIZE, NULL, DISPLAY_TASK_PRIO, &DisplayTask_Handler);

    xTaskCreate((TaskFunction_t)mqtt_task,    "mqtt",
                MQTT_STK_SIZE,    NULL, MQTT_TASK_PRIO,    &MqttTask_Handler);

    xTaskCreate((TaskFunction_t)receive_task, "receive",
                RECEIVE_STK_SIZE, NULL, RECEIVE_TASK_PRIO, &ReceiveTask_Handler);

    xTaskCreate((TaskFunction_t)link_task,    "link",
                LINK_STK_SIZE,    NULL, LINK_TASK_PRIO,    &LinkTask_Handler);

    xTaskCreate((TaskFunction_t)dc01_task,    "dc01",
                DC01_STK_SIZE,    NULL, DC01_TASK_PRIO,    &Dc01Task_Handler);

    taskEXIT_CRITICAL();
    vTaskDelete(NULL);
}

/* ==============================
 *  sensor_task: 传感器采集（AHT20 + ADC气体/风速）
 *  周期: 1000ms
 *  写入: t111, c111, MQ2, MQ135, WIND
 * ============================== */
void sensor_task(void *pvParameters)
{
    TickType_t xLastWakeTime = xTaskGetTickCount();

    for (;;)
    {
        if (xSemaphoreTake(adcMutex, pdMS_TO_TICKS(500)) == pdTRUE)
        {
            chuanganqi();
            xSemaphoreGive(adcMutex);
        }

        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
    }
}

/* ==============================
 *  servo_task: 追光控制（ADC读光敏 + 舵机调整）
 *  周期: 1500ms
 * ============================== */
void servo_task(void *pvParameters)
{
    TickType_t xLastWakeTime = xTaskGetTickCount();

    for (;;)
    {
        if (xSemaphoreTake(adcMutex, pdMS_TO_TICKS(500)) == pdTRUE)
        {
            zuiguang();
            xSemaphoreGive(adcMutex);
        }

        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1500));
    }
}

/* ==============================
 *  display_task: 唯一操作 OLED 的任务
 *  周期: 500ms
 *  统一读取全局数据，一次刷完整屏
 * ============================== */
void display_task(void *pvParameters)
{
    TickType_t xLastWakeTime = xTaskGetTickCount();

    for (;;)
    {
        if (xSemaphoreTake(oledMutex, pdMS_TO_TICKS(200)) == pdTRUE)
        {
            /* 不调 OLED_Clear:每个 ShowNum 用固定 len 带前导零,
             * 同一位置每次都被新字符覆盖.避免 Clear→Refresh 间隔
             * 那一帧空白带来的闪烁感. */

            /* ===== 正常运行显示 4 行 =====
             * 注:DHT11 已弃用,温湿度仍由 AHT20 提供(t111/c111).
             *     mq2 字段被复用为 PM2.5 0-10 等级,但这里直接显示原始 ug/m³
             *     方便看实际空气质量.设备状态 LED/PWQ/CSB 用 1/0 显示. */
            OLED_ShowString(0,  0, (u8*)"T:",      16, 1);
            OLED_ShowNum   (16, 0, (uint32_t)t111, 2, 16, 1);
            OLED_ShowString(32, 0, (u8*)"C H:",    16, 1);
            OLED_ShowNum   (64, 0, (uint32_t)c111, 2, 16, 1);
            OLED_ShowString(80, 0, (u8*)"%",       16, 1);

            OLED_ShowString(0,  16, (u8*)"PM25:",          16, 1);
            OLED_ShowNum   (40, 16, (uint32_t)dc01_pm25, 4, 16, 1);
            OLED_ShowString(72, 16, (u8*)"ug",             16, 1);

            /* ===== MQTT 诊断行(代替 Rain/Wind 显示) =====
             *   N:NN  当前建链步骤(10 AT / 30 CSTT / 40 CIICR / 50 MCONFIG /
             *                       65 MIPSTART / 67 等 CONNECT / 70 MCONNECT /
             *                       75-80 SUB / 90 已建链 / 95 正在 publish)
             *   E:NN  最近一次失败编号(0=无错;1-8=建链阶段;10=cmd 截断;20=publish 失败)
             *   T:NNN 累计成功 publish 次数 mod 1000
             *   编码表见 AIR724UG.h */
            OLED_ShowString(0,   32, (u8*)"N:",                                       16, 1);
            OLED_ShowNum   (16,  32, (uint32_t)g_at_step,                       2, 16, 1);
            OLED_ShowString(32,  32, (u8*)" E:",                                      16, 1);
            OLED_ShowNum   (56,  32, (uint32_t)g_at_err,                        2, 16, 1);
            OLED_ShowString(72,  32, (u8*)" T:",                                      16, 1);
            OLED_ShowNum   (96,  32, (uint32_t)(g_pub_ok % 1000),               3, 16, 1);
            OLED_ShowString(120, 32, (u8*)" ",                                        16, 1);

            OLED_ShowString(0,  48, (u8*)"L:",                                       16, 1);
            OLED_ShowNum   (16, 48, (uint32_t)(led_state == 1 ? 1 : 0),           1, 16, 1);
            OLED_ShowString(32, 48, (u8*)"P:",                                       16, 1);
            OLED_ShowNum   (48, 48, (uint32_t)(pwq_state == 1 ? 1 : 0),           1, 16, 1);
            OLED_ShowString(64, 48, (u8*)"C:",                                       16, 1);
            OLED_ShowNum   (80, 48, (uint32_t)(csb_state == 1 ? 1 : 0),           1, 16, 1);

            OLED_Refresh();
            xSemaphoreGive(oledMutex);
        }

        /* 1500ms 刷一次:sensor 1s / servo 1.5s / mqtt 3s 才更新数据,
         * 500ms 高频刷只是浪费 CPU + 视觉闪烁,1.5s 不影响观察 */
        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1500));
    }
}

/* ==============================
 *  mqtt_task: 定时上报传感器数据到 OneNET
 *  周期: 3000ms
 * ============================== */
void mqtt_task(void *pvParameters)
{
    TickType_t xLastWakeTime = xTaskGetTickCount();
    int fail_cnt = 0;

    for (;;)
    {
        if (link_ok)
        {
            /* shuju1() 内部走 at_send_cmd,会自己拿 uartTxMutex 和 atBusyMutex */
            if (shuju1() == 0)
            {
                fail_cnt = 0;
            }
            else
            {
                if (++fail_cnt >= 3)
                {
                    link_ok  = 0;   /* 标记链路掉了,交给 link_task 重连 */
                    fail_cnt = 0;
                    /* 立刻把 link_task 从 30s 心跳延时里踹起来,
                     * 否则它要等到下一次心跳醒来才发现掉线 */
                    if (linkKickSem != NULL)
                        xSemaphoreGive(linkKickSem);
                }
            }
        }

        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(3000));
    }
}

/* ==============================
 *  receive_task: 接收 UART 字节，解析 +MSUB 指令
 *  事件驱动（阻塞等待 uartQueue）
 * ============================== */
void receive_task(void *pvParameters)
{
    uint8_t ch;
    static char line[LINE_BUF_SIZE];
    static uint16_t len = 0;
    static uint8_t drop_line = 0;

    for (;;)
    {
        if (xQueueReceive(uartQueue, &ch, portMAX_DELAY) != pdTRUE)
            continue;

        do
        {
            if (ch == '\r' || ch == '\n')
            {
                if (!drop_line && len > 0)
                {
                    line[len] = '\0';
                    dispatch_line(line);
                }
                len = 0;
                drop_line = 0;
            }
            else
            {
                if (!drop_line)
                {
                    if (len < LINE_BUF_SIZE - 1)
                        line[len++] = (char)ch;
                    else
                    {
                        drop_line = 1;
                        len = 0;
                    }
                }
            }
        } while (xQueueReceive(uartQueue, &ch, 0) == pdTRUE);
    }
}

/* ======================================================================
 *  以下为 +MSUB JSON 解析函数（逻辑不变，仅 OLED 操作改为设标志位）
 * ====================================================================== */

static int extract_msub_json_len(const char *line,
                                 char *out, size_t out_size,
                                 size_t *out_len)
{
    if (!line || !out || out_size < 2) return 0;
    if (strncmp(line, "+MSUB:", 6) != 0) return 0;

    const char *p = strchr(line, '{');
    if (!p) return 0;

    int depth = 0;
    int in_str = 0;
    char prev = 0;
    size_t idx = 0;

    for (; *p; p++)
    {
        char c = *p;
        if (c == '"' && prev != '\\') in_str = !in_str;
        if (!in_str)
        {
            if (c == '{') depth++;
            else if (c == '}') depth--;
        }
        if (idx < out_size - 1) out[idx++] = c;
        else return 0;
        if (depth == 0)
        {
            out[idx] = '\0';
            if (out_len) *out_len = idx;
            return 1;
        }
        prev = c;
    }
    return 0;
}

static int extract_object_by_key_len(const char *json, size_t json_len,
                                     const char *key,
                                     char *out, size_t out_size)
{
    if (!json || !key || !out || out_size < 2) return 0;

    size_t key_len = strlen(key);

    for (size_t i = 0; i + key_len + 2 < json_len; i++)
    {
        if (json[i] == '"' &&
            memcmp(&json[i + 1], key, key_len) == 0 &&
            json[i + 1 + key_len] == '"')
        {
            size_t j = i + 1 + key_len + 1;
            while (j < json_len && json[j] != '{') j++;
            if (j >= json_len) return 0;

            int depth = 0;
            int in_str = 0;
            char prev = 0;
            size_t idx = 0;

            for (; j < json_len; j++)
            {
                char c = json[j];
                if (c == '"' && prev != '\\') in_str = !in_str;
                if (!in_str)
                {
                    if (c == '{') depth++;
                    else if (c == '}') depth--;
                }
                if (idx < out_size - 1) out[idx++] = c;
                else return 0;
                if (depth == 0)
                {
                    out[idx] = '\0';
                    return 1;
                }
                prev = c;
            }
            return 0;
        }
    }
    return 0;
}

static int json_get_bool_in_obj(const char *obj, const char *field, int *out_val)
{
    if (!obj || !field || !out_val) return 0;

    size_t flen = strlen(field);
    const char *p = obj;

    while ((p = strchr(p, '"')) != NULL)
    {
        p++;
        if (memcmp(p, field, flen) == 0 && p[flen] == '"')
        {
            const char *colon = strchr(p + flen + 1, ':');
            if (!colon) return 0;
            const char *v = colon + 1;
            while (*v == ' ' || *v == '\t') v++;
            /* OneNET 下行:{"led":true}     → 字面值 true/false
             * 阿里云下行 :{"led":1}        → 整数 0/1(物模型 bool 在传输时序列化为 int)
             * 两种都支持,固件就能同时兼容两个云端而不需要重编。 */
            if (strncmp(v, "true", 4) == 0)  { *out_val = 1; return 1; }
            if (strncmp(v, "false", 5) == 0) { *out_val = 0; return 1; }
            if (*v == '1')                    { *out_val = 1; return 1; }
            if (*v == '0')                    { *out_val = 0; return 1; }
            return 0;
        }
    }
    return 0;
}

/* 解析 +MSUB: 只控制 GPIO + 设标志位，不再直接操作 OLED */
static void parse_msub_json_len(const char *json, size_t json_len)
{
    static char params[384];
    int val;

    if (!extract_object_by_key_len(json, json_len, "params", params, sizeof(params)))
        return;

    if (json_get_bool_in_obj(params, "led", &val))
    {
        GPIO_WriteBit(GPIOD, GPIO_Pin_13, val ? Bit_SET : Bit_RESET);
        led_state = val;
    }

    if (json_get_bool_in_obj(params, "pwq", &val))
    {
        GPIO_WriteBit(GPIOD, GPIO_Pin_12, val ? Bit_SET : Bit_RESET);
        pwq_state = val;
    }

    if (json_get_bool_in_obj(params, "csb", &val))
    {
        GPIO_WriteBit(GPIOD, GPIO_Pin_14, val ? Bit_SET : Bit_RESET);
        csb_state = val;
    }
}

static void handle_line_only_msub(char *line)
{
    if (!line || line[0] == '\0') return;
    if (strncmp(line, "+MSUB:", 6) != 0) return;

    static char json[1024];
    size_t json_len = 0;

    if (extract_msub_json_len(line, json, sizeof(json), &json_len))
    {
        parse_msub_json_len(json, json_len);
    }
}

/* ======================================================================
 *  行解析分发器:
 *    +MSUB:      → URC,走原有 handle_line_only_msub
 *    OK / ERROR / +CME ERROR / +CMS ERROR → 投到 atRespQueue 给 at_send_cmd
 *    其它(回显、空行、CONNECT OK、SEND OK 等) → 静默丢弃
 * ====================================================================== */
static void dispatch_line(char *line)
{
    if (!line || line[0] == '\0') return;

    /* 1) 下行 URC: MQTT 服务端下发的指令 */
    if (strncmp(line, "+MSUB:", 6) == 0)
    {
        handle_line_only_msub(line);
        /* +MSUB 也可能被 at_wait_urc 关心(虽然少见),顺便检查一下 */
        at_urc_check_line(line);
        return;
    }

    /* 2) AT 命令应答分类 */
    uint8_t resp = AT_RESP_NONE;
    if      (strcmp(line, "OK") == 0)                resp = AT_RESP_OK;
    else if (strcmp(line, "ERROR") == 0)             resp = AT_RESP_ERROR;
    else if (strncmp(line, "+CME ERROR", 10) == 0)   resp = AT_RESP_CME_ERROR;
    else if (strncmp(line, "+CMS ERROR", 10) == 0)   resp = AT_RESP_CME_ERROR;
    /* ">" 提示符:模组进入二段式数据模式(AT+MPUB=...,len 后会用到)
     * 一般以 "> " 形式作为一行出现 */
    else if (line[0] == '>' && (line[1] == '\0' || line[1] == ' '))
                                                      resp = AT_RESP_PROMPT;

    if (resp != AT_RESP_NONE && atRespQueue != NULL)
    {
        /* 非阻塞:队列若已满说明上一个 at_send_cmd 还没读,丢这条是安全的 */
        (void)xQueueSend(atRespQueue, &resp, 0);
        return;
    }

    /* 3) 主动断链 URC: Air 模组在 TCP / MQTT 掉线时会上报类似:
     *      "+MIPRTCP: 0,CLOSED"   (TCP 被服务端 RST)
     *      "CLOSED"               (短形式)
     *      "+MMQTTDISCONNECT"     (MQTT 层断开)
     *    任何一种出现都说明链路死了,立刻通知 link_task 重连,
     *    免得 mqtt_task 还要 publish 失败 3 次才察觉(白等 9s)。 */
    if (link_ok &&
        (strstr(line, "CLOSED") != NULL ||
         strstr(line, "DISCONNECT") != NULL))
    {
        link_ok = 0;
        if (linkKickSem != NULL)
            xSemaphoreGive(linkKickSem);
        /* fall through:这类行不太可能同时是某个 at_wait_urc 在等的目标,
         *               但顺便检查一下也无副作用 */
    }

    /* 4) 其它行(回显、空行、CONNECT OK、+MIPRTCP CONNECT OK、+CGREG 等):
     *    可能正是某个 at_wait_urc 在等的 URC,交给 URC 匹配器 */
    at_urc_check_line(line);
}

/* ======================================================================
 *  link_task: 维护 MQTT 链路状态
 *    - 上电先做一次 connect + subscribe;失败就退避后重试
 *    - 连上后每 30s 做一次 AT 心跳;连续 2 次 ping 失败标记链路掉线
 *    - mqtt_task 也可能把 link_ok 清零(连续 publish 失败)
 *    - 链路掉线时本任务自动走重连流程
 * ====================================================================== */
void link_task(void *pvParameters)
{
    int ping_miss = 0;

    /* 给模组一点喘息,延时挡上电抖动 */
    vTaskDelay(pdMS_TO_TICKS(2000));

    for (;;)
    {
        if (!link_ok)
        {
            /* (重)连接流程 */
            int r1 = AIR724UG_Mqtt_connect();
            if (r1 != 0)
            {
                /* 退避:连不上时不要疯狂重试,免得耗电/打满串口。
                 * 用 sem 等待:如果 10s 内有人 give(罕见但不影响),提前醒来无妨 */
                if (linkKickSem != NULL)
                    xSemaphoreTake(linkKickSem, pdMS_TO_TICKS(10000));
                else
                    vTaskDelay(pdMS_TO_TICKS(10000));
                continue;
            }

            int r2 = OneNET_Subscribe();
            if (r2 != 0)
            {
                if (linkKickSem != NULL)
                    xSemaphoreTake(linkKickSem, pdMS_TO_TICKS(5000));
                else
                    vTaskDelay(pdMS_TO_TICKS(5000));
                continue;
            }

            link_ok   = 1;
            ping_miss = 0;
            /* 清掉建链过程中可能被遗留的 kick 信号 */
            if (linkKickSem != NULL)
                xSemaphoreTake(linkKickSem, 0);
        }

        /* 已连接:周期性 ping,期间被 mqtt_task 戳 sem 可立刻醒 */
        if (linkKickSem != NULL)
            xSemaphoreTake(linkKickSem, pdMS_TO_TICKS(30000));
        else
            vTaskDelay(pdMS_TO_TICKS(30000));

        if (!link_ok) continue;     /* mqtt_task 已标记掉线 → 直接走重连 */

        if (AIR724UG_Ping() != 0)
        {
            if (++ping_miss >= 2)
            {
                link_ok   = 0;
                ping_miss = 0;
            }
        }
        else
        {
            ping_miss = 0;
        }
    }
}

/* ======================================================================
 *  dc01_task: 解析 DC01 红外 PM2.5 模块的 UART 4 字节帧
 *    协议(9600 8N1, 每 1s 一帧):
 *      Byte0 = 0xA5 (固定特征字节)
 *      Byte1 = DATAH (浓度高 7 位)
 *      Byte2 = DATAL (浓度低 7 位)
 *      Byte3 = SUM   = (0xA5 + DATAH + DATAL) & 0x7F
 *    浓度(ug/m3) = (DATAH & 0x7F) * 128 + (DATAL & 0x7F)
 *    PM2.5      = 浓度 * 0.4  (数据手册建议的 K 标定系数)
 *
 *  本地联动: PM2.5 > 75 ug/m3 → 开喷雾器(PD14) + 关 LED(PD13)
 *    带滞回:PM2.5 < 60 才解除"已触发"标志,避免在阈值附近抖动时
 *    每帧都翻一次设备状态(继电器寿命/嘈杂).
 *    解除触发后不主动反转设备(由云端 +MSUB 决定要不要关),
 *    避免和云端策略打架.
 *
 *  云端字段映射: 复用 mq2 字段(0-10 等级),映射近似国标 PM2.5 等级:
 *    0-35 优=0, 35-75 良=2, 75-115 轻=4, 115-150 中=6, 150-250 重=8, >=250 严=10
 * ====================================================================== */
void dc01_task(void *pvParameters)
{
    uint8_t b;
    uint8_t state = 0;        /* 0=找帧头, 1=收 DATAH, 2=收 DATAL, 3=收 SUM */
    uint8_t datah = 0, datal = 0;
    uint8_t triggered = 0;

    /* dc01RxQueue 在 main 里 dc01_uart_init() 创建,理论上调度器启动时已就绪.
     * 但为防序错,这里再 spin 等一下,不阻塞中断也不烧 CPU. */
    while (dc01RxQueue == NULL) vTaskDelay(pdMS_TO_TICKS(50));

    for (;;)
    {
        if (xQueueReceive(dc01RxQueue, &b, portMAX_DELAY) != pdTRUE)
            continue;

        switch (state)
        {
            case 0:
                if (b == 0xA5) state = 1;
                /* 非帧头字节静默丢弃,继续找同步 */
                break;
            case 1:
                datah = b;
                state = 2;
                break;
            case 2:
                datal = b;
                state = 3;
                break;
            case 3:
            {
                uint8_t sum = (uint8_t)(0xA5 + datah + datal) & 0x7F;
                if (sum == b)
                {
                    uint32_t conc = ((uint32_t)(datah & 0x7F) << 7)
                                  + (uint32_t)(datal & 0x7F);
                    /* PM2.5 = conc * 0.4 = conc * 2 / 5 (整数实现,误差 <1) */
                    uint32_t pm25 = (conc * 2u) / 5u;
                    if (pm25 > 65535u) pm25 = 65535u;
                    dc01_pm25 = (uint16_t)pm25;

                    /* OneNET 物模型 mq2 字段 0-10 等级桶(沿用旧字段,无需改物模型) */
                    if      (pm25 <  35u) MQ2 = 0;
                    else if (pm25 <  75u) MQ2 = 2;
                    else if (pm25 < 115u) MQ2 = 4;
                    else if (pm25 < 150u) MQ2 = 6;
                    else if (pm25 < 250u) MQ2 = 8;
                    else                  MQ2 = 10;

                    /* 本地联动: 阈值 75 触发开喷雾+关 LED,滞回 60 解除标志 */
                    if (!triggered && pm25 > 75u)
                    {
                        GPIO_WriteBit(GPIOD, GPIO_Pin_14, Bit_SET);
                        csb_state = 1;
                        GPIO_WriteBit(GPIOD, GPIO_Pin_13, Bit_RESET);
                        led_state = 0;
                        triggered = 1;
                    }
                    else if (triggered && pm25 < 60u)
                    {
                        triggered = 0;
                    }
                }
                /* 不论校验对错都回到找帧头状态,下次见到 0xA5 重新同步 */
                state = 0;
                break;
            }
            default:
                state = 0;
                break;
        }
    }
}
