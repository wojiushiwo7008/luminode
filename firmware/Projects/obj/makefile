################################################################################
# MRS Version: 1.9.0
# 自动生成的文件。不要编辑！
################################################################################

-include ../makefile.init

RM := rm -rf

# All of the sources participating in the build are defined here
-include sources.mk
-include User/subdir.mk
-include Middlewares/MALLOC/subdir.mk
-include Middlewares/FreeRTOS/portable/MemMang/subdir.mk
-include Middlewares/FreeRTOS/portable/GCC/RISC-V/subdir.mk
-include Middlewares/FreeRTOS/subdir.mk
-include Drivers/Timer/subdir.mk
-include Drivers/SYSTEM/usart/subdir.mk
-include Drivers/SYSTEM/sys/subdir.mk
-include Drivers/SYSTEM/delay/subdir.mk
-include Drivers/RISC_V/Startup/subdir.mk
-include Drivers/RISC_V/Core/subdir.mk
-include Drivers/CH32V30x_Driver/src/subdir.mk
-include Drivers/BSP/Timer/subdir.mk
-include Drivers/BSP/OLED/subdir.mk
-include Drivers/BSP/LED/subdir.mk
-include Drivers/BSP/IIC/subdir.mk
-include Drivers/BSP/DHT11/subdir.mk
-include Drivers/BSP/AIR724UG/subdir.mk
-include Drivers/BSP/AHT20/subdir.mk
-include Drivers/BSP/ADC/subdir.mk
-include subdir.mk
-include objects.mk

ifneq ($(MAKECMDGOALS),clean)
ifneq ($(strip $(ASM_UPPER_DEPS)),)
-include $(ASM_UPPER_DEPS)
endif
ifneq ($(strip $(ASM_DEPS)),)
-include $(ASM_DEPS)
endif
ifneq ($(strip $(S_DEPS)),)
-include $(S_DEPS)
endif
ifneq ($(strip $(S_UPPER_DEPS)),)
-include $(S_UPPER_DEPS)
endif
ifneq ($(strip $(C_DEPS)),)
-include $(C_DEPS)
endif
endif

-include ../makefile.defs

# Add inputs and outputs from these tool invocations to the build variables 
SECONDARY_FLASH += \
FreeRTOS-Porting.hex \

SECONDARY_LIST += \
FreeRTOS-Porting.lst \

SECONDARY_SIZE += \
FreeRTOS-Porting.siz \


# 所有目标
all: FreeRTOS-Porting.elf secondary-outputs

# 工具调用
FreeRTOS-Porting.elf: $(OBJS) $(USER_OBJS)
	@	@	riscv-none-embed-gcc -march=rv32imacxw -mabi=ilp32 -msmall-data-limit=8 -msave-restore -Os -fmessage-length=0 -fsigned-char -ffunction-sections -fdata-sections -fno-common -Wunused -Wuninitialized  -g -T "F:\claudecode\Luminode _ Design System\智慧路灯\Projects\Ld\Link.ld" -nostartfiles -Xlinker --gc-sections -Wl,-Map,"FreeRTOS-Porting.map" --specs=nano.specs -u _printf_float --specs=nosys.specs -o "FreeRTOS-Porting.elf" $(OBJS) $(USER_OBJS) $(LIBS)
	@	@
FreeRTOS-Porting.hex: FreeRTOS-Porting.elf
	@	riscv-none-embed-objcopy -O ihex "FreeRTOS-Porting.elf"  "FreeRTOS-Porting.hex"
	@	@
FreeRTOS-Porting.lst: FreeRTOS-Porting.elf
	@	riscv-none-embed-objdump --all-headers --demangle --disassemble -M xw "FreeRTOS-Porting.elf" > "FreeRTOS-Porting.lst"
	@	@
FreeRTOS-Porting.siz: FreeRTOS-Porting.elf
	@	riscv-none-embed-size --format=berkeley "FreeRTOS-Porting.elf"
	@	@
# 其他目标
clean:
	-$(RM) $(ASM_UPPER_DEPS)$(OBJS)$(SECONDARY_FLASH)$(SECONDARY_LIST)$(SECONDARY_SIZE)$(ASM_DEPS)$(S_DEPS)$(S_UPPER_DEPS)$(C_DEPS) FreeRTOS-Porting.elf
	-@
secondary-outputs: $(SECONDARY_FLASH) $(SECONDARY_LIST) $(SECONDARY_SIZE)

.PHONY: all clean dependents

-include ../makefile.targets
