#ifndef __SYS_H
#define __SYS_H

#include "ch32v30x.h"
#include "stdio.h"

/**
 * SYS_SUPPORT_OS用于定义系统文件夹是否支持OS
 * 0,不支持OS
 * 1,支持OS
 */
#define SYS_SUPPORT_OS          0

#define GPIO_NUMBER             16u

/********************************************************************************************/

void gpio_toggle_pin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);                   /* 切换引脚电平 */
void sys_intx_disable(void);                                                    /* 关闭所有中断 */
void sys_intx_enable(void);                                                     /* 开启所有中断 */
void sys_wfi_set(void);                                                         /* 执行WFI指令 */

#endif


