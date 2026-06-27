///*
// * Timer.c
// *
// *  Created on: 2025年3月24日
// *      Author: Lenovo
// */
#include "ch32v30x.h"
#include <stdio.h>
#include "./BSP/AIR724UG/AIR724UG.h"
#include "./BSP/AHT20/AHT20.h"
#include "BSP/OLED/OLED.h"
#include "BSP/DHT11/DHT11.h"
//extern u16 ii;
//extern uint32_t CT_data[2];
//extern int uart_flag,c11,t11,t1,c1;
//u32 countdown=0 ,MQ2,MQ135,WIND,c,d,e;
//extern u16 humi_value;
//extern u16 temp_value;
//extern u8 temp,humi;
//extern u16 ad;
//extern u16 ads,adsd5,adsd6;
//extern u16 adsd;
//
//void TIM2_IRQHandler(void) __attribute__((interrupt("WCH-Interrupt-fast")));
//void TIM4_IRQHandler(void) __attribute__((interrupt("WCH-Interrupt-fast")));
//void TIM5_IRQHandler(void) __attribute__((interrupt("WCH-Interrupt-fast")));
////arr：自动重装值
////psc：时钟预分频数
//void TIM2_Init(u16 arr,u16 psc)
//{
//
//
//    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
//
//    TIM_InternalClockConfig(TIM2);
//
//    TIM_TimeBaseInitTypeDef TIM_TimeBaseInitStructure;
//    TIM_TimeBaseInitStructure.TIM_ClockDivision = TIM_CKD_DIV1;
//    TIM_TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
//    TIM_TimeBaseInitStructure.TIM_Period = 50000 - 1;
//    TIM_TimeBaseInitStructure.TIM_Prescaler = 21300 - 1;
//    TIM_TimeBaseInitStructure.TIM_RepetitionCounter = 0;
//    TIM_TimeBaseInit(TIM2, &TIM_TimeBaseInitStructure);
//
//    TIM_ClearFlag(TIM2, TIM_FLAG_Update);
//    TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE);
//
//    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
//
//    NVIC_InitTypeDef NVIC_InitStructure;
//    NVIC_InitStructure.NVIC_IRQChannel = TIM2_IRQn;
//    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
//    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
//    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 1;
//    NVIC_Init(&NVIC_InitStructure);
//
//    TIM_Cmd(TIM2, ENABLE);
//
//}
//
//// 定时器中断服务函数
//void TIM2_IRQHandler(void)
//{
//    if (TIM_GetITStatus(TIM2, TIM_IT_Update)!= RESET)
//    {
//        // 清除中断标志
//        TIM_ClearITPendingBit(TIM2, TIM_IT_Update);
////        shuju1();
////        test();
//////        delay_ms(500);
////        GPIO_ResetBits(GPIOD,GPIO_Pin_11);
//////        chuanganqi();
//////        shuju1();
////        GPIO_SetBits(GPIOD,GPIO_Pin_11);
////        zuiguang();
////        shuju1();
////        Clear_Buffer();
//        IWDG_ReloadCounter();
//        GPIO_WriteBit(GPIOD,  GPIO_Pin_11, Bit_SET);
//        DHT11_Read_Data(&temp_value,&humi_value);       //获取温湿度值
//        temp=temp_value/10;
//        humi=humi_value/10;
//        OLED_ShowString(8, 16,"temp:",16,1);
//        OLED_ShowString(8, 32,"humi:",16,1);
//        OLED_ShowNum(80, 16,temp,2,16,1);
//        OLED_ShowNum(80, 32,humi,2,16,1);
//        OLED_Refresh();
//        chuanganqi();
//        OLED_ShowNum(100, 16,adsd6,4,16,1);
//        OLED_ShowNum(100, 32,ads,4,16,1);
//        OLED_Refresh();
//        if(ad<800)MQ2=1;if(ad>800&&ad<1600)MQ2=2;if(ad>1600&&ad<2400)MQ2=3;if(ad>2400&&ad<3200)MQ2=4;if(ad>3200&&ad<4096)MQ2=5;
//        if(ads<800)MQ135=20;if(ads>800&&ads<1600)MQ135=40;if(ads>1600&&ads<2400)MQ135=60;if(ads>2400&&ads<3200)MQ135=80;if(ads>3200&&ads<4096)MQ135=99;
//        if(adsd5<29)WIND=0;if(adsd5>29&&adsd5<216)WIND=1;if(adsd5>216&&adsd5<475)WIND=2;if(adsd5>475&&adsd5<778)WIND=3;if(adsd5>778&&adsd5<1139)WIND=4;
//        if(adsd5>1139&&adsd5<1543)WIND=5;if(adsd5>1543&&adsd5<1990)WIND=6;if(adsd5>1990&&adsd5<2466)WIND=7;if(adsd5>2466&&adsd5<2985)WIND=8;
//        if(adsd5>2985&&adsd5<3519)WIND=9;if(adsd5>3519&&adsd5<4096)WIND=10;
//        if(adsd6<100){GPIO_WriteBit(GPIOD,  GPIO_Pin_14, Bit_SET);}else{GPIO_WriteBit(GPIOD,  GPIO_Pin_14, Bit_RESET);}
//        //        delay_ms(200);
////        printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22humi\\22:{\\22value\\22:%d},\\22temp\\22:{\\22value\\22:%d}}}\"\r\n",humi,temp);
//        printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22humi\\22:{\\22value\\22:%d},\\22temp\\22:{\\22value\\22:%d},\\22MQ2\\22:{\\22value\\22:%d},\\22PM25\\22:{\\22value\\22:%d},\\22wind\\22:{\\22value\\22:%d}}}\"\r\n",humi,temp,MQ2,MQ135,WIND);
//        delay_ms(200);//you  mq2 pa1
////        if(ad<800)MQ2=1;if(ad>800&&ad<1600)MQ2=2;if(ad>1600&&ad<2400)MQ2=3;if(ad>2400&&ad<3200)MQ2=4;if(ad>3200&&ad<4096)MQ2=5;
////        if(ads<800)MQ135=20;if(ads>800&&ads<1600)MQ135=40;if(ads>1600&&ads<2400)MQ135=60;if(ads>2400&&ads<3200)MQ135=80;if(ads>3200&&ads<4096)MQ135=99;
////        printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22MQ2\\22:{\\22value\\22:%d},\\22PM25\\22:{\\22value\\22:%d}}}\"\r\n",MQ2,MQ135);
////        delay_ms(500);
//        GPIO_WriteBit(GPIOD,  GPIO_Pin_11, Bit_RESET);
//        OLED_ShowNum(20,48,e,2,16,1);
//        OLED_Refresh();
//        OLED_ShowNum(80,48,WIND,2,16,1);
//             OLED_Refresh();
//        e++;
//        if(e>80)e=0;
////        delay_ms(10);
//        IWDG_ReloadCounter();
//    }
//    TIM_ClearITPendingBit(TIM2, TIM_IT_Update);
//}
//
void PWM_Init(void)
{
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA|RCC_APB2Periph_GPIOB, ENABLE);
    GPIO_InitTypeDef GPIO_InitStructure;

    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_6|GPIO_Pin_7;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);

    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_0|GPIO_Pin_1;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOB, &GPIO_InitStructure);

    TIM_InternalClockConfig(TIM3);

    TIM_TimeBaseInitTypeDef TIM_TimeBaseInitStructure;
    TIM_TimeBaseInitStructure.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
    TIM_TimeBaseInitStructure.TIM_Period = 2000 - 1;       //ARR
    TIM_TimeBaseInitStructure.TIM_Prescaler = 144 - 1;       //PSC
    TIM_TimeBaseInitStructure.TIM_RepetitionCounter = 0;
    TIM_TimeBaseInit(TIM3, &TIM_TimeBaseInitStructure);

    TIM_OCInitTypeDef TIM_OCInitStructure;
    TIM_OCStructInit(&TIM_OCInitStructure);
    TIM_OCInitStructure.TIM_OCMode = TIM_OCMode_PWM1;
    TIM_OCInitStructure.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OCInitStructure.TIM_OutputState = TIM_OutputState_Enable;
    TIM_OCInitStructure.TIM_Pulse = 0;      //CCR

    TIM_OC1Init(TIM3,&TIM_OCInitStructure);
    TIM_OC2Init(TIM3,&TIM_OCInitStructure);
    TIM_OC3Init(TIM3,&TIM_OCInitStructure);
    TIM_OC4Init(TIM3,&TIM_OCInitStructure);

    TIM_OC1PreloadConfig(TIM3, TIM_OCPreload_Enable);   /* 使能TIMx在CCR1上的预装载寄存器 */
    TIM_OC2PreloadConfig(TIM3, TIM_OCPreload_Enable);   /* 使能TIMx在CCR1上的预装载寄存器 */
    TIM_OC3PreloadConfig(TIM3, TIM_OCPreload_Enable);   /* 使能TIMx在CCR1上的预装载寄存器 */
    TIM_OC4PreloadConfig(TIM3, TIM_OCPreload_Enable);   /* 使能TIMx在CCR1上的预装载寄存器 */
    TIM_Cmd(TIM3, ENABLE);

}

////arr：自动重装值
////psc：时钟预分频数
//void TIM4_Init(u16 arr,u16 psc)
//{
//
//
//    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM4, ENABLE);
//
//    TIM_InternalClockConfig(TIM4);
//
//    TIM_TimeBaseInitTypeDef TIM_TimeBaseInitStructure;
//    TIM_TimeBaseInitStructure.TIM_ClockDivision = TIM_CKD_DIV1;
//    TIM_TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
//    TIM_TimeBaseInitStructure.TIM_Period = 50000 - 1;
//    TIM_TimeBaseInitStructure.TIM_Prescaler = 20000 - 1;
//    TIM_TimeBaseInitStructure.TIM_RepetitionCounter = 0;
//    TIM_TimeBaseInit(TIM4, &TIM_TimeBaseInitStructure);
//
//    TIM_ClearFlag(TIM4, TIM_FLAG_Update);
//    TIM_ITConfig(TIM4, TIM_IT_Update, ENABLE);
//
//    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
//
//    NVIC_InitTypeDef NVIC_InitStructure;
//    NVIC_InitStructure.NVIC_IRQChannel = TIM4_IRQn;
//    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
//    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
//    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 2;
//    NVIC_Init(&NVIC_InitStructure);
//
//    TIM_Cmd(TIM4, ENABLE);
//
//}
//
//// 定时器中断服务函数
//void TIM4_IRQHandler(void)
//{
//    if (TIM_GetITStatus(TIM4, TIM_IT_Update)!= RESET)
//    {
//        // 清除中断标志
//        TIM_ClearITPendingBit(TIM4, TIM_IT_Update);
//        IWDG_ReloadCounter();
//        GPIO_WriteBit(GPIOD,  GPIO_Pin_15, Bit_SET);
//        zuiguang();
//        if(GPIO_ReadInputDataBit(GPIOD, GPIO_Pin_12) == 0)//读取电平6
//        {
//            printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22pwq\\22:{\\22value\\22:false}}}\"\r\n");
//            delay_ms(100);
//        }
//        else
//         {
//         printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22pwq\\22:{\\22value\\22:true}}}\"\r\n");
//         delay_ms(100);
//         }
//        if(GPIO_ReadInputDataBit(GPIOD, GPIO_Pin_14) == 0)//读取电平6
//        {
//            printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22csb\\22:{\\22value\\22:false}}}\"\r\n");
//            delay_ms(100);
//        }
//        else
//         {
//         printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22csb\\22:{\\22value\\22:true}}}\"\r\n");
//         delay_ms(100);
//         }
//        if(GPIO_ReadInputDataBit(GPIOD, GPIO_Pin_13) == 0)//读取电平6
//        {
//            printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22led\\22:{\\22value\\22:false}}}\"\r\n");
//            delay_ms(100);
//        }
//        else
//         {
//         printf("AT+MPUB=\"$sys/K2H9tCmcp9/Smart-street-lights/thing/property/post\",0,0,\"{\\22id\\22:\\22123\\22,\\22params\\22:{\\22led\\22:{\\22value\\22:true}}}\"\r\n");
//         delay_ms(100);
//         }
//        GPIO_WriteBit(GPIOD,  GPIO_Pin_15, Bit_RESET);
//        OLED_ShowNum(40,48,d,2,16,1);
//        OLED_Refresh();
//        d++;
//        if(d>80)d=0;
////        delay_ms(10);
//        IWDG_ReloadCounter();
//    }
//    TIM_ClearITPendingBit(TIM4, TIM_IT_Update);
//}
//
//void TIM5_Init(u16 arr,u16 psc)
//{
//
//
//    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM5, ENABLE);
//
//    TIM_InternalClockConfig(TIM5);
//
//    TIM_TimeBaseInitTypeDef TIM_TimeBaseInitStructure;
//    TIM_TimeBaseInitStructure.TIM_ClockDivision = TIM_CKD_DIV1;
//    TIM_TimeBaseInitStructure.TIM_CounterMode = TIM_CounterMode_Up;
//    TIM_TimeBaseInitStructure.TIM_Period = 600 - 1;
//    TIM_TimeBaseInitStructure.TIM_Prescaler = 14400 - 1;
//    TIM_TimeBaseInitStructure.TIM_RepetitionCounter = 0;
//    TIM_TimeBaseInit(TIM5, &TIM_TimeBaseInitStructure);
//
//    TIM_ClearFlag(TIM5, TIM_FLAG_Update);
//    TIM_ITConfig(TIM5, TIM_IT_Update, ENABLE);
//
//    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
//
//    NVIC_InitTypeDef NVIC_InitStructure;
//    NVIC_InitStructure.NVIC_IRQChannel = TIM5_IRQn;
//    NVIC_InitStructure.NVIC_IRQChannelCmd = ENABLE;
//    NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority = 1;
//    NVIC_InitStructure.NVIC_IRQChannelSubPriority = 3;
//    NVIC_Init(&NVIC_InitStructure);
//
//    TIM_Cmd(TIM5, ENABLE);
//
//}
//
//void gtim_timx_int_init(uint16_t arr, uint16_t psc)
//{
//    TIM_TimeBaseInitTypeDef  timx_handle;
//    NVIC_InitTypeDef nvic_init_struct;
//
//    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM5, ENABLE);                                 /* 使能TIMx时钟 */
//
//    timx_handle.TIM_Period = 60-1;                               /* 设置自动重装载值 */
//    timx_handle.TIM_Prescaler =14400-1;                             /* 设置预分频系数 */
//    timx_handle.TIM_ClockDivision = TIM_CKD_DIV1;               /* 时钟分频因子  */
//    timx_handle.TIM_CounterMode = TIM_CounterMode_Up;           /* 向上计数模式 */
//    TIM_TimeBaseInit(TIM5, &timx_handle);              /* 定时器初始化 */
//
//
//    nvic_init_struct.NVIC_IRQChannel = TIM5_IRQn;      /* TIMx中断 */
//    nvic_init_struct.NVIC_IRQChannelPreemptionPriority = 2;     /* 抢占优先级0 */
//    nvic_init_struct.NVIC_IRQChannelSubPriority = 1;            /* 响应优先级3 */
//    nvic_init_struct.NVIC_IRQChannelCmd = ENABLE;               /* IRQ通道使能 */
//    NVIC_Init(&nvic_init_struct);                               /* 初始化NVIC */
//
//    TIM_ITConfig(TIM5,TIM_IT_Update,ENABLE );          /* 使能指定的TIMx中断,允许更新中断 */
//    TIM_Cmd(TIM5, ENABLE);                             /* 使能TIMx */
//}
//// 定时器中断服务函数
//void TIM5_IRQHandler(void)
//{
//    if (TIM_GetITStatus(TIM5, TIM_IT_Update)!= RESET)
//    {
//        // 清除中断标志
//        TIM_ClearITPendingBit(TIM5, TIM_IT_Update);
////        countdown++;
////        uart_flag=3;
////        printf("countdown=%d\r\n",countdown);
//        zuiguang();
////        test();
////        zuiguang();
//        OLED_ShowNum(58,48,c,2,16,1);
//        OLED_Refresh();
//        c++;
//        if(c>80)c=0;
////        delay_ms(10);
//        IWDG_ReloadCounter();
//    }
////    TIM_ClearITPendingBit(TIM5, TIM_IT_Update);
//}
//
//
//
//
void PWM_SetCompare1(uint16_t Compare)
{
    TIM_SetCompare1(TIM3, Compare);
}

void PWM_SetCompare2(uint16_t Compare)
{
    TIM_SetCompare2(TIM3, Compare);
}


void PWM_SetCompare3(uint16_t Compare)
{
    TIM_SetCompare3(TIM3, Compare);
}

void PWM_SetCompare4(uint16_t Compare)
{
    TIM_SetCompare4(TIM3, Compare);
}

void Servo_Init(void)
{
    PWM_Init();
}

void Servo1_SetAngle(float Angle1)
{
    PWM_SetCompare1(Angle1 / 180 * 2000 + 500);
}

void Servo2_SetAngle(float Angle1)
{
    PWM_SetCompare2(Angle1 / 180 * 2000 + 500);
}

void Servo3_SetAngle(float Angle1)
{
    PWM_SetCompare3(Angle1 / 180 * 2000 + 500);
}

void Servo4_SetAngle(float Angle1)
{
    PWM_SetCompare4(Angle1 / 180 * 2000 + 500);
}

