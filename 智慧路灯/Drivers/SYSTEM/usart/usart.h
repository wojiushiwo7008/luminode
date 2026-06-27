#ifndef __USART_H
#define __USART_H

#include "stdio.h"
#include "./SYSTEM/sys/sys.h"
#include "FreeRTOS.h"
#include "queue.h"


/* ���źʹ��� ���� */
#define USART_TX_GPIO_PORT                      GPIOA
#define USART_TX_GPIO_PIN                       GPIO_Pin_9
#define USART_TX_GPIO_CLK_ENABLE()              do{ RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE); }while(0)   /* PA��ʱ��ʹ�� */

#define USART_RX_GPIO_PORT                      GPIOA
#define USART_RX_GPIO_PIN                       GPIO_Pin_10
#define USART_RX_GPIO_CLK_ENABLE()              do{ RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE); }while(0)   /* PA��ʱ��ʹ�� */

#define USART_UX                                USART1
#define USART_UX_IRQn                           USART1_IRQn
#define USART_UX_IRQHandler                     USART1_IRQHandler
#define USART_UX_CLK_ENABLE()                   do{ RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1, ENABLE); }while(0)  /* USART1 ʱ��ʹ�� */

#define USART_REC_LEN               200         /* �����������ֽ��� 200 */
#define USART_EN_RX                 1           /* ʹ�ܣ�1��/��ֹ��0������1���� */

extern uint8_t  g_usart_rx_buf[USART_REC_LEN];  /* ���ջ���,���USART_REC_LEN���ֽ�.ĩ�ֽ�Ϊ���з� */
extern uint16_t g_usart_rx_sta;                 /* ����״̬��� */

/******************************************************************************************/

void usart_init(uint32_t bound);                /* ���ڳ�ʼ������ */
void UART_init(void);

/* ============ DC01 PM2.5 模块 (USART3 默认引脚: PB10 TX / PB11 RX, 9600 8N1) ============
 *   USART1 给 AIR724UG,USART3 给 DC01。原 debug_uart_init/debug_printf 改造而来。
 *   dc01_uart_init() 把 PB10/PB11 配成 USART3 AF + 开 RX 中断;
 *   ISR 把字节投递到 dc01RxQueue,由外部解析任务消费。
 *   DC01 帧格式协议确认后再补 parser. */
void dc01_uart_init(uint32_t baud);
extern QueueHandle_t dc01RxQueue;

#endif


