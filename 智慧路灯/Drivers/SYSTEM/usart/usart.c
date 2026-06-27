#include "ch32v30x.h"
#include "./SYSTEM/usart/usart.h"
#include "FreeRTOS.h"                   //FreeRTOSʹ��
#include "queue.h"
#include "semphr.h"
#include "task.h"
#include <stdarg.h>
#include <stdio.h>

SemaphoreHandle_t  uartSemaphore;//
QueueHandle_t  uartQueue;
/* DC01 PM2.5 模块字节队列(USART3 RX 中断写入,dc01 解析任务读出) */
QueueHandle_t  dc01RxQueue = NULL;
/* 在 freertos_demo.c 定义:递归互斥,保护所有走 USART1 TX 的输出 */
extern SemaphoreHandle_t uartTxMutex;
char Rx_Buffer[256];
uint32_t buffer_len=0;


void USART1_IRQHandler(void) __attribute__((interrupt("WCH-Interrupt-fast")));
void USART3_IRQHandler(void) __attribute__((interrupt("WCH-Interrupt-fast")));

uint8_t g_usart_rx_buf[USART_REC_LEN];  /* ���ջ���, ���USART_REC_LEN���ֽ� */


/**
 * @brief       ����X��ʼ������
 * @param       ��
 * @retval      ��
 */
void usart_init(uint32_t baudrate)
{
    GPIO_InitTypeDef GPIO_InitStructure;
    USART_InitTypeDef USART_InitStructure;
    NVIC_InitTypeDef NVIC_InitStructure;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1 | RCC_APB2Periph_GPIOA, ENABLE);

    /* PA9 TX */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    /* PA10 RX */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    USART_InitStructure.USART_BaudRate = baudrate;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_Init(USART1, &USART_InitStructure);

    /* ʹ���ж� */
    USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);
    USART_ITConfig(USART1, USART_IT_IDLE, ENABLE);

    /* PFIC �ж����� */
    NVIC_InitStructure.NVIC_IRQChannel = USART1_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&NVIC_InitStructure);

    USART_Cmd(USART1, ENABLE);
}

/**
 * @brief       ����X�жϷ�����
 * @param       ��
 * @retval      ��
 */
void USART1_IRQHandler(void)
{
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    uint8_t Res;

    /* �����ж� */
    if(USART_GetITStatus(USART1, USART_IT_RXNE) != RESET)
    {
        Res = (uint8_t)USART_ReceiveData(USART1);
        xQueueSendFromISR(uartQueue, &Res, &xHigherPriorityTaskWoken);
    }

    /* �����жϣ�����һ֡���ݽ����� */
    if(USART_GetITStatus(USART1, USART_IT_IDLE) != RESET)
    {
        volatile uint32_t tmp;
        tmp = USART1->STATR;   // �ȶ�״̬�Ĵ���
        tmp = USART1->DATAR;   // �ٶ����ݼĴ���
        (void)tmp;

        xSemaphoreGiveFromISR(uartSemaphore, &xHigherPriorityTaskWoken);
    }

    /* ������� */
    if(USART_GetFlagStatus(USART1, USART_FLAG_ORE) != RESET)
    {
        USART_ReceiveData(USART1);       // �� DR �� ORE
        USART_ClearFlag(USART1, USART_FLAG_ORE);
    }

    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}


void UART_init(void)
{
    uartSemaphore = xSemaphoreCreateBinary();
    if(uartSemaphore == NULL)
    {
        printf("uartSemaphore created failed\r\n");
    }

    uartQueue = xQueueCreate(512, sizeof(uint8_t));
    if(uartQueue == NULL)
    {
        printf("uartQueue created failed\r\n");
    }
}




/**
 * @brief       _write����
 * @param       *buf : Ҫ���͵�����,size: Ҫ���͵����ݳ���
 * @retval      size : ���ݳ���
 */
int _write(int fd, char *buf, int size)
{
    int i;
    /* 只有 FreeRTOS 调度器跑起来后才尝试拿锁;否则 boot 阶段直发即可。
     * uartTxMutex 是递归互斥,at_send_cmd 已经持锁时这里能成功重入。 */
    int locked = 0;
    if (uartTxMutex != NULL &&
        xTaskGetSchedulerState() == taskSCHEDULER_RUNNING)
    {
        if (xSemaphoreTakeRecursive(uartTxMutex, pdMS_TO_TICKS(1000)) == pdTRUE)
            locked = 1;
        /* 拿不到锁也继续发,优先保证调试输出不卡死 */
    }

    for(i=0; i<size; i++)
    {
        while (USART_GetFlagStatus(USART_UX, USART_FLAG_TC) == RESET);
        USART_SendData(USART_UX, *buf++);
    }

    if (locked)
        xSemaphoreGiveRecursive(uartTxMutex);
    return size;
}


/* ============ DC01 PM2.5 模块 USART3,默认引脚: PB10 TX / PB11 RX ============
 * 跟 USART1(AIR724UG)完全独立。9600 8N1。RX 中断把字节写入 dc01RxQueue,
 * 由外部 dc01 解析任务消费。TX 暂未使用(若 DC01 需要主动查询命令再加发送函数)。
 */
void dc01_uart_init(uint32_t baud)
{
    GPIO_InitTypeDef  GPIO_InitStructure;
    USART_InitTypeDef USART_InitStructure;
    NVIC_InitTypeDef  NVIC_InitStructure;

    /* 1. 时钟: GPIOB (APB2) + USART3 (APB1) ; 默认引脚不需要 remap */
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_USART3, ENABLE);

    /* 2. PB10 = TX, 复用推挽 */
    GPIO_InitStructure.GPIO_Pin   = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_InitStructure.GPIO_Mode  = GPIO_Mode_AF_PP;
    GPIO_Init(GPIOB, &GPIO_InitStructure);

    /* 3. PB11 = RX, 浮空输入 */
    GPIO_InitStructure.GPIO_Pin  = GPIO_Pin_11;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOB, &GPIO_InitStructure);

    /* 4. USART3 8N1 */
    USART_InitStructure.USART_BaudRate            = baud;
    USART_InitStructure.USART_WordLength          = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits            = USART_StopBits_1;
    USART_InitStructure.USART_Parity              = USART_Parity_No;
    USART_InitStructure.USART_Mode                = USART_Mode_Tx | USART_Mode_Rx;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_Init(USART3, &USART_InitStructure);

    /* 5. RX 字节队列 */
    if (dc01RxQueue == NULL)
        dc01RxQueue = xQueueCreate(128, sizeof(uint8_t));

    /* 6. RX 中断 */
    USART_ITConfig(USART3, USART_IT_RXNE, ENABLE);
    NVIC_InitStructure.NVIC_IRQChannel                    = USART3_IRQn;
    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority  = 2;
    NVIC_InitStructure.NVIC_IRQChannelSubPriority         = 2;
    NVIC_InitStructure.NVIC_IRQChannelCmd                 = ENABLE;
    NVIC_Init(&NVIC_InitStructure);

    USART_Cmd(USART3, ENABLE);
}

/* USART3 RX ISR: 每来一字节就投递到 dc01RxQueue */
void USART3_IRQHandler(void)
{
    BaseType_t hp = pdFALSE;

    if (USART_GetITStatus(USART3, USART_IT_RXNE) != RESET)
    {
        uint8_t b = (uint8_t)USART_ReceiveData(USART3);
        if (dc01RxQueue != NULL)
            xQueueSendFromISR(dc01RxQueue, &b, &hp);
    }
    /* 处理 overrun:读 DR 清 ORE */
    if (USART_GetFlagStatus(USART3, USART_FLAG_ORE) != RESET)
    {
        USART_ReceiveData(USART3);
        USART_ClearFlag(USART3, USART_FLAG_ORE);
    }
    portYIELD_FROM_ISR(hp);
}

