# Luminode · 阿里云 IoT 接入

把项目从 OneNET 迁移到阿里云物联网平台。分两个阶段:

- **Phase A · 云端 + 模拟设备**(本目录已交付)
- **Phase B · CH32V307 固件移植**(等 Phase A 验证通过后开始,见末尾)

---

## 目录结构

```
iot/
├─ tsl/
│   └─ luminode-streetlight.tsl.json   # 完整物模型 JSON,与现有 OneNET 字段对齐
├─ scripts/
│   ├─ env.example.sh                  # 环境变量模板(复制为 env.sh 后填值)
│   ├─ setup-aliyun.sh                 # 一键创建产品 + 物模型 + 设备
│   ├─ teardown.sh                     # 销毁所有资源
│   └─ aliyun_creds_gen.py             # 离线生成 MQTT 三件套 + C 头文件
├─ mock-device/
│   └─ mock_lamp.py                    # Python 模拟"假路灯",验证云端通路
├─ firmware-ch32/                      # Phase B 产出(头文件 + 移植后的 AT 驱动)
└─ README.md                           # 本文件
```

---

## 现状对齐(OneNET → 阿里云)

| 维度 | OneNET 现状 | 阿里云目标 |
|---|---|---|
| ProductID | `K2H9tCmcp9` | `<新生成>` |
| DeviceName | `Smart-street-lights` | `lamp-A24`(可改) |
| MQTT host | `mqtts.heclouds.com:1883` | `<PK>.iot-as-mqtt.cn-shanghai.aliyuncs.com:1883` |
| 鉴权 | OneNET token sign | HMAC-SHA1(timestamp+pk+dn,key=DeviceSecret) |
| 上行 topic | `$sys/<pid>/<dn>/thing/property/post` | `/sys/<pk>/<dn>/thing/event/property/post` |
| 下行 topic | `$sys/<pid>/<dn>/thing/property/set` | `/sys/<pk>/<dn>/thing/service/property/set` |
| 上行 payload | `{"id":"123","params":{"led":{"value":true}}}` | `{"id":"123","version":"1.0","params":{"led":{"value":1}},"method":"thing.event.property.post"}` |
| 下行 payload | `{"params":{"led":true}}` | `{"params":{"led":1}}`(注意 bool 用 0/1) |
| 物模型字段 | led/pwq/csb/temp/humi/wind/MQ2/PM25 | **完全保留同名**(降低固件改动) |

---

## Phase A · 云端搭建(20 分钟)

### 0. 前置检查

```bash
# 检查 aliyun-cli 已装
aliyun --version
# 检查 jq 已装
jq --version
# 检查 aliyun 已配置(执行后不应报 InvalidAccessKeyId)
aliyun iot QueryProductList --PageSize 1 --CurrentPage 1
```

如果上面任一报错,先解决再继续。

> Windows 用户:`aliyun-cli` 用 `winget install AlibabaCloud.AliyunCLI` 或下载 [GitHub release](https://github.com/aliyun/aliyun-cli)。`jq` 用 `winget install jqlang.jq`。

### 1. 配置环境变量

```bash
cd iot/scripts
cp env.example.sh env.sh
# 用你喜欢的编辑器改 DEVICE_NAME 等;默认 lamp-A24 就行
source ./env.sh
```

### 2. 一键拉起云端资源

```bash
./setup-aliyun.sh
```

它会:
1. 创建产品 `Luminode-Streetlight`
2. 导入并发布 TSL(8 个属性 + 2 个事件 + set/get 服务)
3. 注册设备 `lamp-A24`
4. 把 ProductKey / ProductSecret / DeviceSecret 自动写回 `env.sh`

跑完最后会打印 MQTT 接入点和控制台链接。

### 3. 生成 MQTT 凭证(离线)

```bash
source ./env.sh    # 重新 source,让新写入的三元组生效
python aliyun_creds_gen.py
```

会:
- 终端打印 ClientID / Username / Password / MQTT host
- 在 `iot/firmware-ch32/aliyun_creds.h` 生成 C 头文件(供 Phase B 用)

> 这里用的是**远期 timestamp = 2050-01-01**,所以这套签名一直到 2050 年都有效。
> 不用每次启动设备重算签名,固件不用上 SHA1 库,Flash 省了 3KB。

### 4. 用 Python 假路灯验证

```bash
cd ../mock-device
pip install paho-mqtt
python mock_lamp.py
```

预期看到:
```
✓ MQTT 已连接 <PK>.iot-as-mqtt.cn-shanghai.aliyuncs.com:1883
✓ 订阅: /sys/<PK>/lamp-A24/thing/service/property/set
[13:24:01] ↑ telemetry  rc=0 temp=25°C humi=58% pm25=42 led=0 pwq=0 csb=0
```

去**阿里云控制台 → 物联网平台 → 设备 → lamp-A24 → 物模型数据**,应该看到属性值在变。

### 5. 测下行

控制台 → 设备 → **在线调试**:
- 选 `led` 属性,Value 选 1,点"调试"
- mock_lamp.py 终端应该立刻收到:
  ```
  [13:25:30] ↓ /sys/.../thing/service/property/set
       {"method":"thing.service.property.set","id":"...","params":{"led":1},"version":"1.0.0"}
       → 已应用: led=1
  ```
- 下一帧上报 `led=1`,控制台会看到状态翻转

**只要这一步走通,就可以进 Phase B。**

---

## Phase A 排错速查

| 现象 | 可能原因 | 排查 |
|---|---|---|
| `setup-aliyun.sh` 报 InvalidAccessKeyId | aliyun-cli 没配置或配错 region | `aliyun configure list` |
| `ImportThingModelTsl` 报 TSL schema 错 | TSL JSON 改坏了 | 用 [tsl 校验工具](https://iot.console.aliyun.com/lk/devicemodel) 在线检查 |
| mock_lamp 连接 rc=4(密码错) | DeviceSecret 错 / 签名生成有 bug | 重新 `source env.sh` + `python aliyun_creds_gen.py` 看 password 是否一致 |
| mock_lamp 连接 rc=5(未授权) | ProductKey/DeviceName 不匹配 / 设备已被删 | 控制台确认设备存在 |
| 控制台看不到属性数据 | TSL 字段名大小写不对(MQ2/PM25 必须大写) | 对照 `tsl/luminode-streetlight.tsl.json` |
| 下行命令收不到 | 没订阅 set topic / topic 拼错 | mock_lamp 启动日志要有 "✓ 订阅" |

---

## Phase B · CH32V307 固件移植预告(待动工)

需要改动的文件(仅 4 处):

| 文件 | 改动 | 风险 |
|---|---|---|
| `iot/firmware-ch32/aliyun_creds.h` | 自动生成,直接 include | 无 |
| `Drivers/BSP/AIR724UG/AIR724UG.c` | MCONFIG → 阿里云签名;MIPSTART → 新 host;MSUB/MPUB topic 改 | ★★★ |
| `Drivers/BSP/AIR724UG/AIR724UG.h` | 几个常量声明 | ★ |
| `User/freertos_demo.c` | `json_get_bool_in_obj` 增加对 `0/1` 整数的兼容(阿里云 bool 传 int) | ★ |

**计划用 `#define LUMINODE_CLOUD_ALIYUN 1` 开关**,默认走阿里云;切回 OneNET 只需改这一个宏并重编。即:

```c
#if LUMINODE_CLOUD_ALIYUN
  #include "../../../iot/firmware-ch32/aliyun_creds.h"
  ...走阿里云三件套...
#else
  ...走原 OneNET MCONFIG...
#endif
```

待你完成 Phase A 验证后,告诉我开干。
预计净改动 ~150 行,不动 FreeRTOS 调度结构、不动任何传感器代码。

---

## 关于安全

- `env.sh` 含 AccessKey 和 DeviceSecret,已在 `.gitignore`,**绝不要提交**
- `aliyun_creds.h` 含设备签名,**绝不要提交**
- 生产环境(大量设备)应改用阿里云**动态注册**(DynamicRegister),App 端不预埋 secret
- 当前 timestamp=2050 的做法适合**原型/课设/小规模**,生产应启用动态 timestamp + 设备端 HMAC-SHA1
