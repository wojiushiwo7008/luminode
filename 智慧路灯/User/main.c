#include "./SYSTEM/sys/sys.h"
#include "./SYSTEM/delay/delay.h"
#include "./SYSTEM/usart/usart.h"
#include "./BSP/LED/led.h"
#include "./BSP/OLED/oled.h"
#include "./BSP/AHT20/AHT20.h"
#include "./BSP/ADC/adc.h"
#include "BSP/DHT11/DHT11.h"
#include "./BSP/AIR724UG/AIR724UG.h"
#include "./BSP/IIC/bsp_iic.h"
#include "./BSP/Timer/Timer.h"
#include "./MALLOC/malloc.h"
#include "freertos_demo.h"


/* ============================================================
 * 正常工作 main
 * OLED 已迁到 PC4(SCL)/PC5(SDA),2026-06-16 验证可用,DHT11 弃用.
 * ============================================================ */
int main(void)
{
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);     /* 中断优先级分组2 */
    delay_init(144);

    /* AIR724UG 上电唤醒:PA0(经反相器接 PWRKEY)拉高 = 触发开机。
     * 必须在等待 + UART_init 之前,模组才有时间完成冷启动 + LTE 入网。 */
    AIR724UG_PowerOn();

    /* 等 AIR724UG 完成 LTE 入网注册(+CREG/+CGREG 进入 registered)。
     * 这不是只等"AT 回 OK":SIM READY 约 3~5s,但 LTE attach + PDP 上下文
     * 激活通常 8~15s,信号差时甚至更久。少于这个时间就发 AT+CSTT/CIICR 一定
     * ERROR,然后被 link_task 退避 10s 重试,反而看起来更慢甚至连不上。
     * 加上 AIR724UG_PowerOn 内部的 4s PA0 时序,以及后面 Led_Init 的 4s 闪烁,
     * 到调度器启动总计 ~18s,够模组入网。 */
    delay_10s();                                        /* 等模组 LTE 入网,~10s */
    UART_init();                                        /* 先创建 queue/semaphore */
    usart_init(115200);                                 /* 再使能串口中断 */
    dc01_uart_init(9600);                                /* DC01 PM2.5: PB10 TX / PB11 RX @ 9600 */
    Servo_Init();
    I2C_Bus_Init();
    OLED_Init();
    ATH20_Init();
    /* DHT11_Init 已弃用 - PC4 让位给 OLED SCL */
    /* MQTT 连接 + 订阅已移交 link_task,在调度器启动后由该任务统一负责,
     * 并自带失败重试与心跳重连。此处不再盲发 AT 命令。 */
    Led_Init();
    /* ADC_Pin_Init 移到最后:之前放在 OLED_Init/ATH20_Init 之前,被后续 init
     * 里 GPIOA/GPIOC 相关的 GPIO_Init / RCC reset 覆盖,PA3/4/5 + PC0-3 的
     * AIN 模式被打回默认输入态,所以读数全卡 4090(浮空+内部拉)。挪到所有
     * 外设 init 之后,没人再能动这些引脚的模式. */
    ADC_Pin_Init();
    freertos_demo();                                    /* 启动 FreeRTOS 调度 */
}
