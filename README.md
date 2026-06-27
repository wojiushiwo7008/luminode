# Luminode · 智慧路灯

> Every lamp, a node. Every street, a signal.
> 每一盏灯,都是一个节点;每一条街,都是一段信号。

智慧路灯全栈系统:从 **CH32V307 MCU 固件** 到 **阿里云 IoT 平台**,
再到 **React Native 移动端** 和 **运营 Web 仪表盘**,一个 monorepo 装下。

> **云平台:阿里云物联网平台**(2026 Q2 自 OneNET 完成迁移)。
> 实例 ID `iot-06z00g1kofvyi73`,region `cn-shanghai`。
> 历史 OneNET 接入代码已通过 `#define LUMINODE_CLOUD_ALIYUN` 宏隔离,可回退。

---

## 仓库结构

```
luminode/
├─ 智慧路灯/              # CH32V307 + FreeRTOS + AIR724UG 4G 模组固件(主)
│  ├─ User/               # main.c / freertos_demo.c — 传感器采集 + JSON 解析 + 下行执行
│  ├─ Drivers/BSP/        # AIR724UG AT 驱动(MQTT)、传感器驱动(DHT11/MQ2/PM2.5/光照)
│  └─ Middlewares/        # FreeRTOS 内核 + cJSON
│
├─ iot/                   # 阿里云 IoT 接入层(Phase A 已交付)
│  ├─ tsl/                # 物模型 JSON(8 属性 + 2 事件)
│  ├─ scripts/            # setup-aliyun.sh 一键拉起 + aliyun_creds_gen.py 离线签名
│  ├─ mock-device/        # Python 假路灯,验证云端通路
│  └─ firmware-ch32/      # 自动生成的 aliyun_creds.h(已 gitignore)
│
├─ luminode-backend/      # Node.js 后端 — AMQP 服务端订阅 → SQLite → REST
│  └─ src/                # Express + rhea AMQP 1.0 + better-sqlite3
│
├─ luminode-app/          # React Native (Expo) 移动 / Kiosk 控制面板
│  └─ src/                # 设备卡片 / 实时遥测 / 远程控制
│
├─ assets/                # 设计系统:logo / 30+ 自定义 1.5px 线性图标 / 参考图
├─ ui_kits/               # 两个 UI Kit:device-panel(移动) + operator-dashboard(Web)
├─ preview/               # 设计系统概念卡片(HTML 预览)
├─ colors_and_type.css    # 全部设计 token(颜色 / 字体 / 间距 / 阴影 / 动效)
├─ design-canvas.jsx      # 设计系统画布(可视化全部 token)
└─ SKILL.md               # Claude Code agent-skill manifest
```

---

## 数据流

```
传感器(DHT11 / MQ2 / PM2.5 / 光照)
    │ GPIO / I2C
    ▼
CH32V307 + FreeRTOS
    │ AT 指令
    ▼
AIR724UG 4G 模组(MQTT)
    │ /sys/<PK>/<DN>/thing/event/property/post
    ▼
阿里云 IoT 平台 (iot-06z00g1kofvyi73 · cn-shanghai)
    │ AMQP 1.0 服务端订阅
    ▼
luminode-backend  ──►  SQLite (telemetry_latest)
    ▲                       │
    │ POST /control         │ GET /devices/:dn
    │                       ▼
   luminode-app (Expo RN)  ◄─┘
        │ 下行控制
        ▼ Aliyun OpenAPI · SetDeviceProperty
   阿里云 IoT 平台
```

---

## 子项目速览

| 目录 | 角色 | 入门 |
|---|---|---|
| [`智慧路灯/`](智慧路灯/) | MCU 固件 | MounRiver Studio 打开 `Projects/`,build & flash |
| [`iot/`](iot/README.md) | 云端接入 | `cd iot/scripts && cp env.example.sh env.sh && ./setup-aliyun.sh` |
| [`luminode-backend/`](luminode-backend/README.md) | API 网关 | `cd luminode-backend && cp .env.example .env && npm install && npm run dev` |
| [`luminode-app/`](luminode-app/) | 移动端 | `cd luminode-app && npm install && npx expo start` |
| `ui_kits/`、`preview/`、`colors_and_type.css` | 设计系统 | 浏览器打开 `design_canvas.html` |

每个子项目内含独立 README,包含完整的安装、配置、排错。

---

## 设计系统

设计系统是从零搭起来的(用户未提供 codebase / Figma / 品牌),
仅基于一张参考截图(`assets/reference/user-mobile-ui.jpg`)和一句话
"智慧路灯,接入云平台读取和控制硬件设备"。

**关键词:** Calm · Civic · Technical · Bilingual(CN 主 / EN 等位)

**视觉语言:**
- 主色 `--brand-glow #14B8A6`(薄荷-青,像黄昏路灯的灯头光晕)
- 锚色 `--brand-civic #1E40AF`(深蓝,数据 / 焦点)
- 强调 `--brand-amber #F59E0B`(琥珀,致敬钠灯,数据节点专用)
- 字体三件套:Inter(拉丁) + Noto Sans SC(中文) + JetBrains Mono(数值)
- 4px 基准网格,卡片 14px 圆角,极淡阴影,**不使用毛玻璃 / 紫蓝渐变 / 霓虹**

完整规范见 `colors_and_type.css` 顶部的 token 注释,
以及 `ui_kits/` 下两个 UI Kit 的活样例。

---

## 当前状态

| 模块 | 状态 |
|---|---|
| 设计系统 | ✅ 完成(token / 30+ 图标 / 2 套 UI Kit) |
| 固件 (`智慧路灯/`) | ✅ 跑通,当前接 OneNET。**Phase B 阿里云移植待动工**(预计净改 ~150 行,4 处文件) |
| 阿里云 IoT Phase A | ✅ 云端 + 模拟设备验证通过 |
| `luminode-backend` | ✅ AMQP 订阅 + REST + SQLite |
| `luminode-app` | ✅ 设备列表 + 遥测 + 控制下发 |

---

## 安全

本仓库已经 `.gitignore` 屏蔽所有凭证类文件:

- `**/.env*` — 含 AccessKey / DeviceSecret
- `**/aliyun_creds.h` — 含 MQTT 三件套签名
- `**/env.sh`、`**/env.sh.bak`
- `*.pem` `*.key` `*.p12` `*.pfx`
- 本机代理配置 `config.yaml`、运维脚本 `*.ps1`

仍请遵守:
- 任何 AccessKey 仅用 **RAM 子账号**,授权范围限 `AliyunIOTFullAccess`
- 生产环境(大量设备)应使用阿里云 **动态注册**(DynamicRegister),不在 App 端预埋 secret
- `iot/firmware-ch32/aliyun_creds.h` 用了**远期 timestamp = 2050-01-01** 的签名,适合原型 / 课设 / 小规模;生产应改用设备端实时 HMAC-SHA1

---

## License

未定。课设 / 个人作品,如需复用请先 issue 联系。
