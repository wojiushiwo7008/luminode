#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

#include "./SYSTEM/sys/sys.h"
#include "./SYSTEM/delay/delay.h"

#define configMTIME_BASE_ADDRESS 	            0
#define configMTIMECMP_BASE_ADDRESS             0

/* ���������� */
#define configUSE_PREEMPTION			        1                               /* 1: ��ռʽ������, 0: Э��ʽ������, ��Ĭ���趨�� */
#define configUSE_IDLE_HOOK				        0                               /* 1: ʹ��/�رտ��������Ӻ���, ��Ĭ���趨��  */
#define configUSE_TICK_HOOK				        0                               /* 1: ʹ��/�ر�ϵͳʱ�ӽ����жϹ��Ӻ���, ��Ĭ���趨�� */
#define configCPU_CLOCK_HZ				        SystemCoreClock                 /* ����CPU��Ƶ, ��λ: Hz, ��Ĭ���趨�� */
#define configTICK_RATE_HZ				        1000                            /* ����ϵͳʱ�ӽ���Ƶ��, ��λ: Hz, ��Ĭ���趨�� */
#define configMAX_PRIORITIES			        15                              /* ����������ȼ���, ������ȼ�=configMAX_PRIORITIES-1, ��Ĭ���趨�� */
#define configMINIMAL_STACK_SIZE		        128                             /* ������������ջ�ռ��С, ��λ: Word, ��Ĭ���趨�� */
#define configTOTAL_HEAP_SIZE			        ((size_t)(30 * 1024))           /* CH32V307有64KB RAM，给FreeRTOS 30KB */           /* FreeRTOS���п��õ�RAM����, ��λ: Byte, ��Ĭ���趨�� */
#define configMAX_TASK_NAME_LEN			        16                              /* ��������������ַ���, Ĭ��: 16 */
#define configUSE_TRACE_FACILITY		        1                               /* 1: ʹ�ܿ��ӻ����ٵ���, Ĭ��: 0 */
#define configUSE_16_BIT_TICKS			        0                               /* 1: ����ϵͳʱ�ӽ��ļ���������������Ϊ16λ�޷�����, ��Ĭ���趨�� */
#define configIDLE_SHOULD_YIELD			        1                               /* 1: ʹ������ռʽ������,ͬ���ȼ�����������ռ��������, Ĭ��: 1 */
#define configUSE_MUTEXES				        1                               /* 1: ʹ�ܻ����ź���, Ĭ��: 0 */
#define configQUEUE_REGISTRY_SIZE		        8                               /* �������ע����ź�������Ϣ���еĸ���, Ĭ��: 0 */
#define configCHECK_FOR_STACK_OVERFLOW	        2                               /* 1: ʹ��ջ�����ⷽ��1, 2: ʹ��ջ�����ⷽ��2, Ĭ��: 0 */
#define configUSE_RECURSIVE_MUTEXES		        1                               /* 1: ʹ�ܵݹ黥���ź���, Ĭ��: 0 */
#define configUSE_MALLOC_FAILED_HOOK	        1                               /* 1: ʹ�ܶ�̬�ڴ�����ʧ�ܹ��Ӻ���, Ĭ��: 0 */
#define configUSE_APPLICATION_TASK_TAG	        0
#define configUSE_COUNTING_SEMAPHORES	        1                               /* 1: ʹ�ܼ����ź���, Ĭ��: 0 */
#define configGENERATE_RUN_TIME_STATS	        0                               /* 1: ʹ����������ʱ��ͳ�ƹ���, Ĭ��: 0 */
#define configUSE_PORT_OPTIMISED_TASK_SELECTION 0                                /* 1: ʹ��Ӳ��������һ��Ҫ���е�����, 0: ʹ�������㷨������һ��Ҫ���е�����, Ĭ��: 0 */

/* Э����ض��� */
#define configUSE_CO_ROUTINES 			        0
#define configMAX_CO_ROUTINE_PRIORITIES         2

/* ������ʱ����ض��� */
#define configUSE_TIMERS				        1
#define configTIMER_TASK_PRIORITY		        (configMAX_PRIORITIES - 1)
#define configTIMER_QUEUE_LENGTH		        5
#define configTIMER_TASK_STACK_DEPTH	        (configMINIMAL_STACK_SIZE * 2)


#define configUSE_TRACE_FACILITY                1
#define INCLUDE_uxTaskGetStackHighWaterMark     1

/* ��ѡ����, 1: ʹ�� */
#define INCLUDE_vTaskPrioritySet			    1
#define INCLUDE_uxTaskPriorityGet			    1
#define INCLUDE_vTaskDelete					    1
#define INCLUDE_vTaskCleanUpResources		    1
#define INCLUDE_vTaskSuspend				    1
#define INCLUDE_vTaskDelayUntil				    1
#define INCLUDE_vTaskDelay					    1
#define INCLUDE_eTaskGetState				    1
#define INCLUDE_xTimerPendFunctionCall		    1
#define INCLUDE_xTaskAbortDelay				    1
#define INCLUDE_xTaskGetHandle				    1
#define INCLUDE_xSemaphoreGetMutexHolder	    1

/* ���� */
#define configASSERT( x ) if( ( x ) == 0 ) { taskDISABLE_INTERRUPTS(); printf("err at line %d of file \"%s\". \r\n ",__LINE__,__FILE__); while(1); }

/* ӳ��printf���� */
#define configPRINT_STRING( pcString )  printf( pcString )

#endif
