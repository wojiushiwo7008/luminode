/*
 * AIR724UG.h
 *
 *  Created on: 2024-08-14
 *      Author: Lenovo
 *
 *  v2: 同步 AT 引擎,所有 connect/subscribe/publish 都返回 0 表示成功,非 0 表示失败步骤号。
 */

#ifndef BSP_AIR724UG_AIR724UG_H_
#define BSP_AIR724UG_AIR724UG_H_

#include "ch32v30x.h"
#include "string.h"
#include "stdio.h"
#include "./SYSTEM/sys/sys.h"
#include "./SYSTEM/delay/delay.h"

#include "FreeRTOS.h"
#include "queue.h"
#include "semphr.h"

/* AT 命令应答分类(被 freertos_demo.c 的行解析器投递到 atRespQueue) */
typedef enum {
    AT_RESP_NONE      = 0,
    AT_RESP_OK        = 1,
    AT_RESP_ERROR     = 2,
    AT_RESP_CME_ERROR = 3,
    AT_RESP_PROMPT    = 4   /* 预留:模组数据模式的 ">" 提示符 */
} at_resp_t;

/* 由 AIR724UG_AT_Init() 创建,line dispatcher 写入,at_send_cmd 读取 */
extern QueueHandle_t      atRespQueue;
extern SemaphoreHandle_t  atBusyMutex;

/* ====== OLED 诊断面板用 ======
 *   g_at_step  : 当前所处建链步骤
 *      0  上电/空闲       10 AT ping        30 CSTT           40 CIICR
 *      50 MCONFIG         60 MIPCLOSE       65 MIPSTART       67 等 CONNECT OK
 *      70 MCONNECT        75 SUB post_reply 80 SUB prop_set
 *      90 已建链(空转)  95 正在 publish
 *   g_at_err   : 最近一次失败的步骤号(返回值绝对值),0=最近一次成功
 *   g_pub_ok   : 累计成功 publish 次数
 *   g_pub_fail : 累计失败 publish 次数
 */
extern volatile int      g_at_step;
extern volatile int      g_at_err;
extern volatile uint32_t g_pub_ok;
extern volatile uint32_t g_pub_fail;

/* 在 freertos_demo.c 中定义,用于保护 USART1 TX */
extern SemaphoreHandle_t  uartTxMutex;

/* 模组上电唤醒:把 PA0 配成推挽输出并拉高
 *   硬件:MCU PA0 → 反相器 → AIR724UG PWRKEY
 *         MCU 高 = PWRKEY 低 = 模组开机
 *   时序:配完拉高即返回。调用方需要在此之后阻塞 ≥2s(本工程实际等 20s
 *         给 LTE 入网),期间 PA0 保持高即可。
 *   必须在 usart_init() 之前调用 */
void AIR724UG_PowerOn(void);

/* 必须在 vTaskStartScheduler() 之前调用,创建 atRespQueue / atBusyMutex */
void AIR724UG_AT_Init(void);

/* 发送一条 AT 命令并等待期望应答
 *   cmd        : AT 命令(不含尾部 \r\n,内部会追加)
 *   expect     : 期望命中的应答(通常是 AT_RESP_OK)
 *   timeout_ms : 等待应答的总超时
 *   返回 0=成功命中, 负值=失败/超时
 */
int  at_send_cmd(const char *cmd, at_resp_t expect, uint32_t timeout_ms);

/* 链路心跳:发 AT 等 OK */
int  AIR724UG_Ping(void);

/* 通用 URC 等待(两段式,避免丢失发命令期间到达的 URC):
 *   at_arm_urc(substr): 在发送可能触发 URC 的命令前调用,登记匹配串并清状态
 *   at_wait_urc(timeout): 在命令发出后调用,等待已登记的 URC
 *   注意:只允许一个任务使用这对 API(本工程里是 link_task)
 *         返回 0=命中, 负值=超时/未初始化
 */
void at_arm_urc(const char *substr);
int  at_wait_urc(uint32_t timeout_ms);

/* 给 dispatch_line 调用:判断一行是否命中正在等待的 URC */
void at_urc_check_line(const char *line);

/* 完整的连接 / 订阅 / 上报。返回 0 表示成功,负值表示失败步骤 */
int  AIR724UG_Mqtt_connect(void);
int  OneNET_Subscribe(void);
int  shuju1(void);

/* 兼容老代码的延时函数(boot 阶段等模组上电稳定) */
void delay_30s(void);
void delay_10s(void);

#endif /* BSP_AIR724UG_AIR724UG_H_ */
