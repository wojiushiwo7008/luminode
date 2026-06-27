/*
 * Timer.h
 *
 *  Created on: 2025Äê3ÔÂ24ÈÕ
 *      Author: Lenovo
 */

#ifndef BSP_TIMER_TIMER_H_
#define BSP_TIMER_TIMER_H_
void gtim_timx_int_init(uint16_t arr, uint16_t psc);
void PWM_Init(void);
void PWM_SetCompare1(uint16_t Compare);
void PWM_SetCompare2(uint16_t Compare);
void PWM_SetCompare3(uint16_t Compare);
void PWM_SetCompare4(uint16_t Compare);
void TIM2_Init(u16 arr,u16 psc);
void TIM4_Init(u16 arr,u16 psc);
void TIM5_Init(u16 arr,u16 psc);
void Servo_Init(void);
void Servo1_SetAngle(float Angle1);
void Servo2_SetAngle(float Angle2);
void Servo3_SetAngle(float Angle);
void Servo4_SetAngle(float Angle);

#endif /* BSP_TIMER_TIMER_H_ */
