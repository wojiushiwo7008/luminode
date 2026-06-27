#ifndef __OLED_H
#define __OLED_H

//#include "sys.h"
#include "stdlib.h"
#include <stdint.h>
//-----------------OLED�˿ڶ���----------------

/* 软 I²C 引脚: PC4=SCL, PC5=SDA (最终落点 - DHT11 弃用让出 PC4,PC5 空闲;
 * 引脚定义与 bsp_iic.h 的 Soft_I2C_* 保持一致) */

/* OLED 驱动芯片选择:
 *   未定义 = SSD1306 (0.96" 标准)
 *   定义为 1 = SH1106 (1.3" 多见,部分 0.96" 模块也是 SH1106 驱动)
 * SH1106 与 SSD1306 的关键差异:
 *   1. SH1106 GDDRAM 是 132×64,显示从第 2 列开始,需要列地址 +2 偏移
 *   2. SH1106 没有电荷泵指令 0x8D/0x14,改用 DC-DC 控制 0xAD/0x8B
 *   3. 其余指令(0xAF/0xAE/0x81/0xA1/0xC8 等)兼容,可不动 */
#define OLED_DRIVER_SH1106  1   /* 注释掉 = SSD1306 (0.96" 标准),解开 = SH1106 (1.3" / 132 列偏移) */

/* I²C 写地址(SSD1306/SH1106 都用):
 *   0x78 = SA0=0 (大多数 0.96" 模块出厂默认)
 *   0x7A = SA0=1 (部分模块焊死的)
 * 黑屏排查时先试 0x78,不亮就改 0x7A 再烧. */
#define OLED_I2C_ADDR   0x78
#define OLED_SCL_Clr() GPIO_ResetBits(GPIOC,GPIO_Pin_4)//SCL = PC4
#define OLED_SCL_Set() GPIO_SetBits(GPIOC,GPIO_Pin_4)

#define OLED_SDA_Clr() GPIO_ResetBits(GPIOC,GPIO_Pin_5)//SDA = PC5
#define OLED_SDA_Set() GPIO_SetBits(GPIOC,GPIO_Pin_5)


#define OLED_CMD  0 //д����
#define OLED_DATA 1 //д����

void OLED_ClearPoint(uint8_t x,uint8_t y);
void OLED_ColorTurn(uint8_t i);
void OLED_DisplayTurn(uint8_t i);
void I2C_Start(void);
void I2C_Stop(void);
void I2C_WaitAck(void);
void Send_Byte(uint8_t dat);
void OLED_WR_Byte(uint8_t dat,uint8_t mode);
void OLED_DisPlay_On(void);
void OLED_DisPlay_Off(void);
void OLED_Refresh(void);
void OLED_Clear(void);
void OLED_DrawPoint(uint8_t x,uint8_t y,uint8_t t);
void OLED_DrawLine(uint8_t x1,uint8_t y1,uint8_t x2,uint8_t y2,uint8_t mode);
void OLED_DrawCircle(uint8_t x,uint8_t y,uint8_t r);
void OLED_ShowChar(uint8_t x,uint8_t y,uint8_t chr,uint8_t size1,uint8_t mode);
void OLED_ShowChar6x8(uint8_t x,uint8_t y,uint8_t chr,uint8_t mode);
void OLED_ShowString(uint8_t x,uint8_t y,uint8_t *chr,uint8_t size1,uint8_t mode);
void OLED_ShowNum(uint8_t x,uint8_t y,uint32_t num,uint8_t len,uint8_t size1,uint8_t mode);
void OLED_ShowChinese(uint8_t x,uint8_t y,uint8_t num,uint8_t size1,uint8_t mode);
void OLED_ScrollDisplay(uint8_t num,uint8_t space,uint8_t mode);
void OLED_ShowPicture(uint8_t x,uint8_t y,uint8_t sizex,uint8_t sizey,uint8_t BMP[],uint8_t mode);
void OLED_Init(void);

#endif

