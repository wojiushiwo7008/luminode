################################################################################
# MRS Version: 1.9.0
# 自动生成的文件。不要编辑！
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
S_UPPER_SRCS += \
F:/claudecode/Luminode\ _\ Design\ System/智慧路灯/Drivers/RISC_V/Startup/startup_ch32v30x_D8C.S 

OBJS += \
./Drivers/RISC_V/Startup/startup_ch32v30x_D8C.o 

S_UPPER_DEPS += \
./Drivers/RISC_V/Startup/startup_ch32v30x_D8C.d 


# Each subdirectory must supply rules for building sources it contributes
Drivers/RISC_V/Startup/startup_ch32v30x_D8C.o: F:/claudecode/Luminode\ _\ Design\ System/智慧路灯/Drivers/RISC_V/Startup/startup_ch32v30x_D8C.S
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -x assembler-with-cpp -I"F:\claudecode\Luminode _ Design System\智慧路灯\Middlewares\FreeRTOS" -I"F:\claudecode\Luminode _ Design System\智慧路灯\Middlewares\FreeRTOS\include" -I"F:\claudecode\Luminode _ Design System\智慧路灯\Middlewares\FreeRTOS\portable\GCC\RISC-V" -I"F:\claudecode\Luminode _ Design System\智慧路灯\Middlewares\FreeRTOS\portable\GCC\RISC-V\chip_specific_extensions\RV32I_PFIC_no_extensions" -I"F:\claudecode\Luminode _ Design System\智慧路灯\Middlewares\FreeRTOS\portable\MemMang" -MMD -MP -MF"$(@:%.o=%.d)" -MT"$(@)" -c -o "$@" "$<"
	@	@

