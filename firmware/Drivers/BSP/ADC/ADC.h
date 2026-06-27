/*
 * ADC.h
 *
 *  Created on: 2025Äê6ÔÂ10ÈÕ
 *      Author: Lenovo
 */
#ifndef _ADC_H_
#define _ADC_H_

#include "ch32v30x.h"

void ADC_Pin_Init(void);
u16 ADC_Trans(void);
u16 Get_Adc_Average(u8 ch,u8 times);
void ADC2_Pin_Init(void);
u16 ADC2_Trans(void);
u16 Get_Adc2_Average(u8 ch,u8 times);
void chuanganqi(void);
void zuiguang(void);
#endif
