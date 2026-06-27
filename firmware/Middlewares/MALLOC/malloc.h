#ifndef __MALLOC_H
#define __MALLOC_H

#include "./SYSTEM/sys/sys.h"

/* 定义内存池 */
#define SRAMIN      0       /* 内部SRAM */

#define SRAMBANK    1       /* 定义支持的SRAM块数.实际上只支持1个内存区域,即内部内存. */

/* 定义内存管理表类型,当外扩SDRAM的时候，必须使用uint32_t类型，否则可以定义成uint16_t，以节省内存占用 */
#define MT_TYPE     uint16_t

/* 单块内存，内存管理所占用的全部空间大小计算公式如下：
 * size = MEM1_MAX_SIZE + (MEM1_MAX_SIZE / MEM1_BLOCK_SIZE) * sizeof(MT_TYPE)
 * 以SRAMIN为例，size = 40 * 1024 + (40 * 1024 / 32) * 2 = 43520 = 42.5KB

/* CH32V307内部SRAM配置 */
#define MEM1_BLOCK_SIZE         32                              /* 内存块大小为32字节 */
#define MEM1_MAX_SIZE           40 * 1024                       /* 管理内存 40KB */
#define MEM1_ALLOC_TABLE_SIZE   MEM1_MAX_SIZE/MEM1_BLOCK_SIZE   /* 内存表大小 */

/* 如果没有定义NULL, 定义NULL */
#ifndef NULL
#define NULL 0
#endif

/* 内存管理控制器 */
struct _m_mallco_dev
{
    void (*init)(uint8_t);              /* 初始化 */
    uint16_t (*perused)(uint8_t);       /* 内存使用率 */
    uint8_t *membase[SRAMBANK];         /* 内存池 管理SRAMBANK个区域的内存 */
    MT_TYPE *memmap[SRAMBANK];          /* 内存管理状态表 */
    uint8_t  memrdy[SRAMBANK];          /* 内存管理是否就绪 */
};

extern struct _m_mallco_dev mallco_dev; /* 在mallco.c里面定义 */

/******************************************************************************************/

void my_mem_init(uint8_t memx);                             /* 内存管理初始化函数(外/内部调用) */
uint16_t my_mem_perused(uint8_t memx) ;                     /* 获得内存使用率(外/内部调用) */
void my_mem_set(void *s, uint8_t c, uint32_t count);        /* 内存设置函数 */
void my_mem_copy(void *des, void *src, uint32_t n);         /* 内存拷贝函数 */

void myfree(uint8_t memx, void *ptr);                       /* 内存释放(外部调用) */
void *mymalloc(uint8_t memx, uint32_t size);                /* 内存分配(外部调用) */
void *myrealloc(uint8_t memx, void *ptr, uint32_t size);    /* 重新分配内存(外部调用) */

#endif

