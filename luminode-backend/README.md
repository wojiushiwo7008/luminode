# Luminode Backend

Phase C 用的本地后端:把阿里云 IoT 的上下行包成 App 能直接吃的 REST API。

## 架构

```
设备(CH32 / mock_lamp)
    │ MQTT 上行
    ▼
阿里云 IoT 平台
    │ AMQP 1.0 服务端订阅(本后端订阅产品下所有上行)
    ▼
luminode-backend  ──►  SQLite (telemetry_latest)
    ▲                       │
    │ POST /control         │ GET /devices/:dn
    │                       ▼
   App (RN, Expo)  ◄────────┘
        ▲ 下行控制
    阿里云 OpenAPI (SetDeviceProperty)
```

## 一次性准备

1. 控制台 → 公共实例 `iot-06z00g1kofvyi73` → 消息转发 → 服务端订阅 →
   "AMQP 消费组" 标签页 → 创建消费组,记下名字(默认可填 `luminode-backend`)
2. 同页 → "服务端订阅" 标签页 → 创建订阅,推送方式选 AMQP,选刚才的消费组,
   订阅类型勾上 **设备上报消息** 和 **设备状态变更**
3. `cp .env.example .env`,填好 `ALIYUN_UID` / `ACCESS_KEY_ID` / `ACCESS_KEY_SECRET` /
   `AMQP_CONSUMER_GROUP_ID`(就是上面那个名字)

## 跑起来

```bash
npm install
npm run dev
```

预期日志:

```
[HTTP] listening :3000
[AMQP] connecting to iot-06z00g1kofvyi73.amqp.iothub.aliyuncs.com:5671
[AMQP] connected
[AMQP] received property post from lamp-A24: temp=24 humi=58 ...
```

## REST 端点

- `GET  /healthz`              — 健康检查 + AMQP 状态
- `GET  /devices`              — 所有见过上行的设备列表
- `GET  /devices/:dn`          — 单设备最新一帧
- `POST /devices/:dn/control`  — 下发属性,body 形如 `{"led": 1}`
