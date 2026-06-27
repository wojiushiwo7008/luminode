/*
 * ADC.c
 *
 *  Created on: 2025��6��10��
 *      Author: Lenovo
 */


#include "./BSP/ADC/adc.h"
#include "./SYSTEM/delay/delay.h"
#include "./SYSTEM/usart/usart.h"
#include "./BSP/Timer/Timer.h"
#include "./BSP/AHT20/AHT20.h"
#include "FreeRTOS.h"
#include "task.h"
#include "timers.h"
#include "stack_macros.h"

/* 传感器原始数据 */
uint32_t CT_data[2];
int  c1, t1;
u16 ad = 0;          /* ADC Channel 1 */
u16 ads = 0;         /* ADC Channel 2 */
u16 adsd = 0;        /* ADC Channel 3 (雨滴) */
u16 adsd5 = 0;       /* ADC Channel 12 (风速) */
u16 adsd6 = 0;       /* ADC Channel 13 */

/* 追光 ADC */
u16 adsd1 = 0, adsd2 = 0, adsd3 = 0, adsd4 = 0;

/* 对外输出的换算结果 */
int t111;             /* 温度整数部分 (℃) */
int c111;             /* 湿度整数部分 (%) */
u32 MQ2, MQ135, WIND;

/* 舵机角度（有符号，防下溢） */
int16_t zx = 60;
int16_t yx = 85;
int16_t zs = 45;
int16_t ys = 55;
/*******************************************************************************
*������ԭ�ͣ�void ADC_Pin_Init(void)
*�����Ĺ��ܣ�GPIO��ʼ��
*�����Ĳ�����None
*����������PB0 ADC1_IN0 ģ������
*������д�ߣ�quan
*������д���ڣ�2022/7/23
*�����İ汾�ţ�V1.0.0
********************************************************************************/
void ADC_Pin_Init(void)
{
    ADC_InitTypeDef ADC_InitStructure;
    GPIO_InitTypeDef GPIO_InitStructure;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA |RCC_APB2Periph_GPIOC |RCC_APB2Periph_ADC1, ENABLE );     //ʹ��ADC1ͨ��ʱ��


    RCC_ADCCLKConfig(RCC_PCLK2_Div6);   //����ADC��Ƶ����6 72M/6=12,ADC���ʱ�䲻�ܳ���14M

    /* PA1/PA2 已被软件 I²C(OLED)占用,不能再做 ADC;
     * PA3 = 雨滴, PA4/PA5 = 追光,保留. */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_3|GPIO_Pin_4|GPIO_Pin_5;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0|GPIO_Pin_1|GPIO_Pin_2|GPIO_Pin_3;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;       //ģ����������
    GPIO_Init(GPIOC, &GPIO_InitStructure);

    ADC_DeInit(ADC1);  //��λADC1,������ ADC1 ��ȫ���Ĵ�������Ϊȱʡֵ

    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;  //ADC����ģʽ:ADC1��ADC2�����ڶ���ģʽ
    ADC_InitStructure.ADC_ScanConvMode = DISABLE;   //ģ��ת�������ڵ�ͨ��ģʽ
    ADC_InitStructure.ADC_ContinuousConvMode = DISABLE; //ģ��ת�������ڵ���ת��ģʽ
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None; //ת���������������ⲿ��������
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;  //ADC�����Ҷ���
    ADC_InitStructure.ADC_NbrOfChannel = 9; //˳����й���ת����ADCͨ������Ŀ
    ADC_Init(ADC1, &ADC_InitStructure); //����ADC_InitStruct��ָ���Ĳ�����ʼ������ADCx�ļĴ���


    ADC_Cmd(ADC1, ENABLE);  //ʹ��ָ����ADC1

    ADC_ResetCalibration(ADC1); //ʹ�ܸ�λУ׼

    while(ADC_GetResetCalibrationStatus(ADC1)); //�ȴ���λУ׼����

    ADC_StartCalibration(ADC1);  //����ADУ׼

    while(ADC_GetCalibrationStatus(ADC1));   //�ȴ�У׼����

//  ADC_SoftwareStartConvCmd(ADC1, ENABLE);     //ʹ��ָ����ADC1������ת����������
}

/*******************************************************************************
*������ԭ�ͣ�u16 ADC_Trans(void)
*�����Ĺ��ܣ�ADC��ȡ����
*�����Ĳ�����None
*��������ֵ��
    @ u16������50�ε�ƽ��ֵ
*������˵����
*������д�ߣ�quan
*������д���ڣ�2022/7/23
*�����İ汾�ţ�V1.0.0
********************************************************************************/
u16 ADC_Trans(void)
{
    u16 adc_value = 0;
    u8 i = 0;

    for(i = 0; i < 50; i++)
    {

        //��ʼת��
        ADC_SoftwareStartConvCmd(ADC1,ENABLE);

        //ת���Ƿ����
        while(ADC_GetFlagStatus(ADC1,ADC_FLAG_EOC) != SET);
        adc_value = adc_value + ADC_GetConversionValue(ADC1);//��ADC�е�ֵ
    }

    return adc_value / 50;
}

//���ADCֵ
//ch:ͨ��ֵ 0~3
u16 Get_Adc(u8 ch)
{
    //����ָ��ADC�Ĺ�����ͨ����һ�����У�����ʱ��
    ADC_RegularChannelConfig(ADC1, ch, 1, ADC_SampleTime_239Cycles5 );  //ADC1,ADCͨ��,����ʱ��Ϊ239.5����

    ADC_SoftwareStartConvCmd(ADC1, ENABLE);     //ʹ��ָ����ADC1������ת����������

    while(!ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC ));//�ȴ�ת������

    return ADC_GetConversionValue(ADC1);    //�������һ��ADC1�������ת�����
}

u16 Get_Adc_Average(u8 ch,u8 times)
{
    u32 temp_val=0;
    u8 t;
    for(t=0;t<times;t++)
    {
        temp_val+=Get_Adc(ch);
        vTaskDelay(2);
    }
    return temp_val/times;
}

void chuanganqi(void)
{
    /* AHT20 一次读取同时返回温度和湿度，无需读两次 */
    ATH20_Read_CTdata(CT_data);
    t1 = CT_data[1] * 200 * 10 / 1024 / 1024 - 500;  /* 温度*10, 如245=24.5℃ */
    c1 = CT_data[0] * 1000 / 1024 / 1024;             /* 湿度*10, 如523=52.3% */
    t111 = t1 / 10;
    c111 = c1 / 10;

    /* PA1/PA2 已让位给 OLED 软 I²C(MQ-2 / MQ-135 模块已停用),不再 ADC 读取;
     * MQ2/MQ135 全局变量保留但不再赋值,JSON 已删除这两个字段. */
    adsd  = Get_Adc_Average(ADC_Channel_3, 1);     /* PA3: 雨滴 raw */
    adsd5 = Get_Adc_Average(ADC_Channel_12, 1);    /* 风速 raw(无传感器时浮空≈4095) */
    adsd6 = Get_Adc_Average(ADC_Channel_13, 1);

    /* 风速等级判定:严格按 ADC 值 0~4095 线性分 11 档,
     * 外接不同电压(0V→WIND=0,3.3V→WIND=10)能直接反映出来. */
    if      (adsd5 <= 29)   WIND = 0;
    else if (adsd5 <= 216)  WIND = 1;
    else if (adsd5 <= 475)  WIND = 2;
    else if (adsd5 <= 778)  WIND = 3;
    else if (adsd5 <= 1139) WIND = 4;
    else if (adsd5 <= 1543) WIND = 5;
    else if (adsd5 <= 1990) WIND = 6;
    else if (adsd5 <= 2466) WIND = 7;
    else if (adsd5 <= 2985) WIND = 8;
    else if (adsd5 <= 3519) WIND = 9;
    else                    WIND = 10;
}


void zuiguang(void)
{
    /*׷��1*/
    adsd1 = Get_Adc_Average(ADC_Channel_4,1);
//      printf("��ѹֵ��%f\r\n",3.3/4095*ad);
//    uart_flag=3;
//    printf("ZG1=%f\r\n",adsd1 / 4096.0);//ΪʲôҪ��99  ��ADֵת���ɰٷֱ�0~99
//    delay_ms(500);

    /*׷��2*/
    adsd2 = Get_Adc_Average(ADC_Channel_5,1);
//      printf("��ѹֵ��%f\r\n",3.3/4095*ad);
//    uart_flag=3;
//    printf("ZG2=%f\r\n",adsd2 / 4096.0);//ΪʲôҪ��99  ��ADֵת���ɰٷֱ�0~99
//    delay_ms(500);

    /*׷��3*/
    adsd3 = Get_Adc_Average(ADC_Channel_10,1);
//      printf("��ѹֵ��%f\r\n",3.3/4095*ad);
//    uart_flag=3;
//    printf("ZG3=%f\r\n",adsd3 / 4096.0);//ΪʲôҪ��99  ��ADֵת���ɰٷֱ�0~99
//    delay_ms(500);

    /*׷��4*/
    adsd4 = Get_Adc_Average(ADC_Channel_11,1);
//      printf("��ѹֵ��%f\r\n",3.3/4095*ad);
//    uart_flag=3;
//    printf("ZG4=%f\r\n",adsd4 / 4096.0);//ΪʲôҪ��99  ��ADֵת���ɰٷֱ�0~99
//    delay_ms(500);
    if(adsd1 > adsd2)
    {
        zx -= 5;
        yx -= 5;
    }
    else if(adsd1 < adsd2)
    {
        zx += 5;
        yx += 5;
    }
    /* 先限幅再驱动舵机 */
    if(zx > 100) zx = 100;  if(zx < 20) zx = 20;
    if(yx > 125) yx = 125;  if(yx < 45) yx = 45;
    Servo1_SetAngle(zx);
    Servo3_SetAngle(yx);

    if(adsd3 > adsd4)
    {
        zs += 5;
        ys += 5;
    }
    else if(adsd3 < adsd4)
    {
        zs -= 5;
        ys -= 5;
    }
    if(zs > 70) zs = 70;  if(zs < 20) zs = 20;
    if(ys > 80) ys = 80;  if(ys < 30) ys = 30;
    Servo2_SetAngle(zs);
    Servo4_SetAngle(ys);
}

