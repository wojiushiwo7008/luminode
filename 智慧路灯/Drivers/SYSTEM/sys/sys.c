#include "./SYSTEM/sys/sys.h"


/**
  * @brief  切换引脚电平
  * @param  GPIOx:    端口
  *         GPIO_Pin: 引脚
  * @retval None
  */
void gpio_toggle_pin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin)
{
  uint32_t odr;

  odr = GPIOx->OUTDR;

  GPIOx->BSHR = ((odr & GPIO_Pin) << GPIO_NUMBER) | (~odr & GPIO_Pin);
}

/**
 * @brief       关闭所有中断
 * @param       无
 * @retval      无
 */
void sys_intx_disable(void)
{
    __disable_irq();
}

/**
 * @brief       开启所有中断
 * @param       无
 * @retval      无
 */
void sys_intx_enable(void)
{
    __enable_irq();
}

/**
 * @brief       执行: WFI指令(执行完该指令进入低功耗状态, 等待中断唤醒)
 * @param       无
 * @retval      无
 */
void sys_wfi_set(void)
{
    __asm volatile("wfi");
}

