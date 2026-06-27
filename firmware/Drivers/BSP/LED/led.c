#include "./BSP/LED/led.h"
#include "./SYSTEM/delay/delay.h"

LED_INFO led_info = {0};
/*
************************************************************
*   �������ƣ�   Led_Init
*
*   �������ܣ�   ��������ʼ��
*
*   ��ڲ�����   ��
*
*   ���ز�����   ��
*
*   ˵����
************************************************************
*/
void Led_Init(void)
{

    GPIO_InitTypeDef gpio_initstruct;

    /* 注意:PA0 不在这里初始化!它是 AIR724UG 的 PWRKEY(经反相器),
     *       归 AIR724UG_PowerOn() 管,main.c 已在上电阶段把它拉高。
     *       这里如果再 GPIO_Init(GPIOA, Pin_0) 虽然不会改 ODR,但容易误导。 */
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC|RCC_APB2Periph_GPIOD, ENABLE);

    gpio_initstruct.GPIO_Mode  = GPIO_Mode_Out_PP;
    gpio_initstruct.GPIO_Pin   = GPIO_Pin_13|GPIO_Pin_10;
    gpio_initstruct.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOC, &gpio_initstruct);

    gpio_initstruct.GPIO_Pin   = GPIO_Pin_11|GPIO_Pin_12|GPIO_Pin_13|GPIO_Pin_14|GPIO_Pin_15;
    GPIO_Init(GPIOD, &gpio_initstruct);

    /* 开机自检闪烁:三个继电器/LED 输出在 GPIOD 上来回切换一次 */
    GPIO_WriteBit(GPIOD, GPIO_Pin_11|GPIO_Pin_12|GPIO_Pin_13|GPIO_Pin_14|GPIO_Pin_15, Bit_RESET);
    delay_ms(2000);
    GPIO_WriteBit(GPIOD, GPIO_Pin_11|GPIO_Pin_12|GPIO_Pin_13|GPIO_Pin_14|GPIO_Pin_15, Bit_SET);
    delay_ms(2000);
    GPIO_WriteBit(GPIOD, GPIO_Pin_11|GPIO_Pin_12|GPIO_Pin_13|GPIO_Pin_14|GPIO_Pin_15, Bit_RESET);

}

/*
************************************************************
*   �������ƣ�   Led_Set
*
*   �������ܣ�   ����������
*
*   ��ڲ�����   status�����ط�����
*
*   ���ز�����   ��
*
*   ˵����     ��-LED_ON        ��-LED_OFF
************************************************************
*/
void Led_Set(_Bool status)
{

    GPIO_WriteBit(GPIOC, GPIO_Pin_13, status == LED_ON ? Bit_RESET : Bit_SET);      //���status����LED_ON���򷵻�Bit_SET�����򷵻�Bit_RESET

    led_info.Led_Status = status;

}




