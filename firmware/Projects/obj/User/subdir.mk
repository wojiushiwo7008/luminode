################################################################################
# MRS Version: 1.9.0
# ×Ô¶¯Éú³ÉµÄÎÄ¼þ¡£²»Òª±à¼­£¡
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/ch32v30x_it.c \
F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/freertos_demo.c \
F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/main.c \
F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/system_ch32v30x.c 

OBJS += \
./User/ch32v30x_it.o \
./User/freertos_demo.o \
./User/main.o \
./User/system_ch32v30x.o 

C_DEPS += \
./User/ch32v30x_it.d \
./User/freertos_demo.d \
./User/main.d \
./User/system_ch32v30x.d 


# Each subdirectory must supply rules for building sources it contributes
User/ch32v30x_it.o: F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/ch32v30x_it.c
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\User" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\RISC_V\Core" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\CH32V30x_Driver\inc" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\include" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\MemMang" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V\chip_specific_extensions\RV32I_PFIC_no_extensions" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\ADC" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AHT20" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AIR724UG" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\DHT11" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\IIC" -I"/FreeRTOS-Porting/Drivers/BSP/OLED" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\Timer" -std=gnu99 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@)" -c -o "$@" "$<"
	@	@
User/freertos_demo.o: F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/freertos_demo.c
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\User" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\RISC_V\Core" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\CH32V30x_Driver\inc" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\include" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\MemMang" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V\chip_specific_extensions\RV32I_PFIC_no_extensions" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\ADC" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AHT20" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AIR724UG" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\DHT11" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\IIC" -I"/FreeRTOS-Porting/Drivers/BSP/OLED" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\Timer" -std=gnu99 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@)" -c -o "$@" "$<"
	@	@
User/main.o: F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/main.c
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\User" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\RISC_V\Core" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\CH32V30x_Driver\inc" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\include" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\MemMang" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V\chip_specific_extensions\RV32I_PFIC_no_extensions" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\ADC" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AHT20" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AIR724UG" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\DHT11" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\IIC" -I"/FreeRTOS-Porting/Drivers/BSP/OLED" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\Timer" -std=gnu99 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@)" -c -o "$@" "$<"
	@	@
User/system_ch32v30x.o: F:/claudecode/Luminode\ _\ Design\ System/ÖÇ»ÛÂ·µÆ/User/system_ch32v30x.c
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\User" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\RISC_V\Core" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\CH32V30x_Driver\inc" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\include" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\MemMang" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Middlewares\FreeRTOS\portable\GCC\RISC-V\chip_specific_extensions\RV32I_PFIC_no_extensions" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\ADC" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AHT20" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\AIR724UG" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\DHT11" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\IIC" -I"/FreeRTOS-Porting/Drivers/BSP/OLED" -I"F:\claudecode\Luminode _ Design System\ÖÇ»ÛÂ·µÆ\Drivers\BSP\Timer" -std=gnu99 -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@)" -c -o "$@" "$<"
	@	@

