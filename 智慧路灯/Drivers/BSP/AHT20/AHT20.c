/*
 * AHT20.c
 *
 *  Created on: 2025��6��10��
 *      Author: Lenovo
 */


/*
 * AHT20.c
 *
 *  Created on: 2024��7��27��
 *      Author: Lenovo
 */

#include "AHT20.h"
extern int uart_flag;
#include "./SYSTEM/delay/delay.h"
#include "stdio.h"
#include "FreeRTOS.h"
#include "task.h"
#include "timers.h"
#include "stack_macros.h"

/* ============================================================
 * AHT20 专用软件 I²C (PB6=SCL, PB7=SDA)
 * ------------------------------------------------------------
 * 原来 AHT20 走 bsp_iic 的 Sensors_I2C_*,但 bsp_iic 已被 OLED 改到
 * PC4/PC5(GPIOC),AHT20 物理接在 PB6/PB7 上读不到。
 * 所以这里给 AHT20 单独实现一套 bitbang I²C,引脚硬编码 PB6/PB7,
 * 不依赖 bsp_iic.h 避免互相干扰。
 * ============================================================ */
#define AHT20_SCL_PIN    GPIO_Pin_6
#define AHT20_SDA_PIN    GPIO_Pin_7
#define AHT20_I2C_PORT   GPIOB

#define AHT20_SCL_1()   GPIO_SetBits(AHT20_I2C_PORT, AHT20_SCL_PIN)
#define AHT20_SCL_0()   GPIO_ResetBits(AHT20_I2C_PORT, AHT20_SCL_PIN)
#define AHT20_SDA_1()   GPIO_SetBits(AHT20_I2C_PORT, AHT20_SDA_PIN)
#define AHT20_SDA_0()   GPIO_ResetBits(AHT20_I2C_PORT, AHT20_SDA_PIN)
#define AHT20_SDA_IN()  GPIO_ReadInputDataBit(AHT20_I2C_PORT, AHT20_SDA_PIN)

#define AHT20_NOP()     delay_us(10)

static void AHT20_I2C_Init(void)
{
    GPIO_InitTypeDef gpio;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    gpio.GPIO_Pin   = AHT20_SCL_PIN | AHT20_SDA_PIN;
    gpio.GPIO_Mode  = GPIO_Mode_Out_OD;     /* 开漏,外部上拉拉高 */
    gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(AHT20_I2C_PORT, &gpio);
    AHT20_SCL_1();
    AHT20_SDA_1();
    delay_ms(2);
}

static void AHT20_I2C_Start(void)
{
    AHT20_SDA_1(); AHT20_NOP();
    AHT20_SCL_1(); AHT20_NOP();
    AHT20_SDA_0(); AHT20_NOP();
    AHT20_SCL_0(); AHT20_NOP();
}

static void AHT20_I2C_Stop(void)
{
    AHT20_SDA_0(); AHT20_NOP();
    AHT20_SCL_1(); AHT20_NOP();
    AHT20_SDA_1(); AHT20_NOP();
}

/* 返回 0=收到 ACK,非 0=超时 */
static uint8_t AHT20_I2C_WaitAck(void)
{
    uint8_t cnt = 0;
    AHT20_SDA_1(); AHT20_NOP();
    AHT20_SCL_1(); AHT20_NOP();
    while (AHT20_SDA_IN())
    {
        if (++cnt > 250) { AHT20_I2C_Stop(); return 1; }
    }
    AHT20_SCL_0();
    return 0;
}

static void AHT20_I2C_SendAck(void)
{
    AHT20_SDA_0(); AHT20_NOP();
    AHT20_SCL_1(); AHT20_NOP();
    AHT20_SCL_0(); AHT20_NOP();
}

static void AHT20_I2C_SendNack(void)
{
    AHT20_SDA_1(); AHT20_NOP();
    AHT20_SCL_1(); AHT20_NOP();
    AHT20_SCL_0(); AHT20_NOP();
}

static uint8_t AHT20_I2C_SendByte(uint8_t b)
{
    uint8_t i;
    AHT20_SCL_0();
    for (i = 0; i < 8; i++)
    {
        if (b & 0x80) AHT20_SDA_1();
        else          AHT20_SDA_0();
        b <<= 1;
        AHT20_NOP();
        AHT20_SCL_1(); AHT20_NOP();
        AHT20_SCL_0(); AHT20_NOP();
    }
    return AHT20_I2C_WaitAck();
}

/* ack=1 主机回 ACK 继续读,ack=0 回 NACK 结束 */
static uint8_t AHT20_I2C_RecvByte(uint8_t ack)
{
    uint8_t i, dat = 0;
    AHT20_SDA_1();
    AHT20_SCL_0();
    for (i = 0; i < 8; i++)
    {
        AHT20_SCL_1(); AHT20_NOP();
        dat <<= 1;
        if (AHT20_SDA_IN()) dat |= 0x01;
        AHT20_SCL_0(); AHT20_NOP();
    }
    if (ack) AHT20_I2C_SendAck();
    else     AHT20_I2C_SendNack();
    return dat;
}

/* 替代 Sensors_I2C_WriteRegister: START, slave|W, reg, data[0..len-1], STOP */
static int AHT20_WriteReg(uint8_t slave, uint8_t reg, uint8_t len, const uint8_t *data)
{
    uint8_t i;
    AHT20_I2C_Start();
    if (AHT20_I2C_SendByte(slave << 1))         return -1;
    if (AHT20_I2C_SendByte(reg))                return -1;
    for (i = 0; i < len; i++)
        if (AHT20_I2C_SendByte(data[i]))        return -1;
    AHT20_I2C_Stop();
    return 0;
}

/* 替代 Sensors_I2C_ReadRegister: START, slave|W, reg, RESTART, slave|R, read..., NACK, STOP */
static int AHT20_ReadReg(uint8_t slave, uint8_t reg, uint8_t len, uint8_t *data)
{
    uint8_t i;
    AHT20_I2C_Start();
    if (AHT20_I2C_SendByte(slave << 1))             return -1;
    if (AHT20_I2C_SendByte(reg))                    return -1;
    AHT20_I2C_Start();
    if (AHT20_I2C_SendByte((slave << 1) | 0x01))    return -1;
    for (i = 0; i < len; i++)
        data[i] = AHT20_I2C_RecvByte(i < (len - 1));  /* 最后一字节 NACK */
    AHT20_I2C_Stop();
    return 0;
}


uint8_t ATH20_Read_Status(void)//��ȡAHT10��״̬�Ĵ���
{
    uint8_t Byte_first;
    AHT20_ReadReg(ATH20_SLAVE_ADDRESS, 0x00, 1, &Byte_first);

    return Byte_first;
}

uint8_t ATH20_Read_Cal_Enable(void)
{
    uint8_t val = 0;//ret = 0,

    val = ATH20_Read_Status();
    if((val & 0x68) == 0x08)  //�ж�NORģʽ��У׼����Ƿ���Ч
        return 1;
    else
        return 0;
}

void ATH20_Read_CTdata(uint32_t *ct) //��ȡAHT10���¶Ⱥ�ʪ������
{
    uint32_t RetuData = 0;
    uint16_t cnt = 0;
    uint8_t Data[10];
    uint8_t tmp[10];

    tmp[0] = 0x33;
    tmp[1] = 0x00;
    AHT20_WriteReg(ATH20_SLAVE_ADDRESS, StartTest, 2, tmp);
    vTaskDelay(75);//�ȴ�75ms

    cnt = 0;
    while(((ATH20_Read_Status()&0x80) == 0x80))//�ȴ�æ״̬����
    {
        vTaskDelay(1);
        if(cnt++ >= 100)
        {
            break;
        }
    }

    AHT20_ReadReg(ATH20_SLAVE_ADDRESS, 0x00, 7, Data);

    RetuData = 0;
    RetuData = (RetuData|Data[1]) << 8;
    RetuData = (RetuData|Data[2]) << 8;
    RetuData = (RetuData|Data[3]);
    RetuData = RetuData >> 4;
    ct[0] = RetuData;

    RetuData = 0;
    RetuData = (RetuData|Data[3]) << 8;
    RetuData = (RetuData|Data[4]) << 8;
    RetuData = (RetuData|Data[5]);
    RetuData = RetuData&0xfffff;
    ct[1] = RetuData;
}

uint8_t count;
uint8_t ATH20_Init(void)
{
    uint8_t tmp[10];

    AHT20_I2C_Init();   /* 初始化 PB6/PB7 软 I²C 引脚 */
    delay_ms(40);

    tmp[0] = 0x08;
    tmp[1] = 0x00;
    AHT20_WriteReg(ATH20_SLAVE_ADDRESS, INIT, 2, tmp);

    delay_ms(500);
    count = 0;

    while(ATH20_Read_Cal_Enable() == 0)//��Ҫ�ȴ�״̬��status��Bit[3]=1ʱ��ȥ�����ݡ����Bit[3]������1 ����������λ0xBA��AHT10�������³�ʼ��AHT10��ֱ��Bit[3]=1
    {
        AHT20_WriteReg(ATH20_SLAVE_ADDRESS, SoftReset, 0, tmp);
        delay_ms(200);

        AHT20_WriteReg(ATH20_SLAVE_ADDRESS, INIT, 2, tmp);

        count++;
        if(count >= 10)
            return 0;
        delay_ms(500);
    }
    return 1;
}
