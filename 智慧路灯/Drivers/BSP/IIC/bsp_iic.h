/*
 * bsp_iic.h
 *
 *  Created on: 2024��7��27��
 *      Author: Lenovo
 */

#ifndef __BSP_IIC_H
#define __BSP_IIC_H


#include "ch32v30x.h"

/*********************软件 I²C 引脚定义(最终落在 PC4/PC5)****************************/
/* 迁移历程:
 *   1. 原来 PB6/PB7 — 释放给其他用途
 *   2. 改到 PA1/PA2 — 测试时 OLED 模块 VCC 被错误供 5V,反灌击穿 PA1/PA2 ESD,SCL/SDA 卡在 0.5V
 *   3. 短暂迁到 PE2/PE6 — 板上 PE 排针位置不顺手
 *   4. 现在 PC4(SCL) / PC5(SDA) — PC4 原 DHT11 已注释(main.c:87),弃用温湿度传感器,
 *      PC5 工程未用,完全空闲 */
#define Soft_I2C_SDA        GPIO_Pin_5       /* PC5 = SDA */
#define Soft_I2C_SCL        GPIO_Pin_4       /* PC4 = SCL (原 DHT11 弃用) */
#define Soft_I2C_PORT       GPIOC
//
#define Soft_I2C_SCL_0      GPIO_ResetBits(Soft_I2C_PORT, Soft_I2C_SCL)
#define Soft_I2C_SCL_1      GPIO_SetBits(Soft_I2C_PORT, Soft_I2C_SCL)
#define Soft_I2C_SDA_0      GPIO_ResetBits(Soft_I2C_PORT, Soft_I2C_SDA)
#define Soft_I2C_SDA_1      GPIO_SetBits(Soft_I2C_PORT, Soft_I2C_SDA)

/*�ȴ���ʱʱ��*/
#define I2CT_FLAG_TIMEOUT         ((uint32_t)0x1000)
#define I2CT_LONG_TIMEOUT         ((uint32_t)(10 * I2CT_FLAG_TIMEOUT))


void I2C_Bus_Init(void);

void Set_I2C_Retry(unsigned short ml_sec);
unsigned short Get_I2C_Retry(void);
int Sensors_I2C_ReadRegister(unsigned char Address, unsigned char RegisterAddr,
                                          unsigned short RegisterLen, unsigned char *RegisterValue);
int Sensors_I2C_WriteRegister(unsigned char Address, unsigned char RegisterAddr,
                                           unsigned short RegisterLen, const unsigned char *RegisterValue);
void Soft_I2C_Configuration(void);//SCL��PB6��SDA��PB7

#endif /* BSP_IIC_BSP_IIC_H_ */
