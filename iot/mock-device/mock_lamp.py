"""
Luminode · Python 模拟路灯设备

用途
----
在 CH32 真硬件不在手边时,模拟一个上报传感器数据 + 响应控制命令的"假路灯"。
跑通这一步就证明:阿里云 IoT 产品/物模型/设备/权限 全部配好了,
后续固件移植只剩 AT 指令层。

安装依赖:
    pip install paho-mqtt

运行:
    source ../scripts/env.sh
    python mock_lamp.py

控制方式:
    1. 阿里云物联网平台控制台 → 设备 → 在线调试 → 下发属性 → 选 led/pwq/csb
    2. 或在 Luminode App 里点开关(等 App 也接上后)
"""

from __future__ import annotations
import json
import os
import random
import signal
import sys
import threading
import time
from datetime import datetime

# Windows 控制台默认 GBK,emoji / ✓ 会炸。强制 utf-8 输出
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("❌ 缺 paho-mqtt,请先:  pip install paho-mqtt", file=sys.stderr)
    sys.exit(1)

# ============ 配置(从环境变量读取,setup-aliyun.sh 跑完会有) ============

PK     = os.environ.get("PRODUCT_KEY", "")
DN     = os.environ.get("DEVICE_NAME", "")
SECRET = os.environ.get("DEVICE_SECRET", "")
REGION = os.environ.get("ALIYUN_REGION", "cn-shanghai")

if not all([PK, DN, SECRET]):
    print("❌ 缺少 PRODUCT_KEY / DEVICE_NAME / DEVICE_SECRET。先 source env.sh", file=sys.stderr)
    sys.exit(1)

# 复用 aliyun_creds_gen.py 的算法
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from aliyun_creds_gen import build_credentials, FAR_FUTURE_TS_MS  # noqa: E402

CLIENT_ID, USERNAME, PASSWORD, MQTT_HOST = build_credentials(
    PK, DN, SECRET, REGION, FAR_FUTURE_TS_MS
)
MQTT_PORT = 1883

# ============ Topics ============
TOPIC_PROP_POST       = f"/sys/{PK}/{DN}/thing/event/property/post"
TOPIC_PROP_POST_REPLY = f"/sys/{PK}/{DN}/thing/event/property/post_reply"
TOPIC_PROP_SET        = f"/sys/{PK}/{DN}/thing/service/property/set"
TOPIC_PROP_SET_REPLY  = f"/sys/{PK}/{DN}/thing/service/property/set_reply"

# ============ 设备状态(模拟"硬件") ============
state = {
    "led": 0,
    "pwq": 0,
    "csb": 0,
}
state_lock = threading.Lock()

# 自增的 message id(对应 OneNET 旧版 "id":"123")
msg_id = 0

def next_msg_id():
    global msg_id
    msg_id += 1
    return str(msg_id)

# ============ 上报 ============

def fake_sensors():
    """模拟 AHT20 + DC01 + ADC 风速。每秒抖一点,看着像真的。"""
    return {
        "temp":  random.randint(22, 28),
        "humi":  random.randint(50, 65),
        "wind":  random.randint(0, 6),
        "MQ2":   random.choice([0, 0, 2, 2, 4]),       # 多数空气优良
        "PM25":  random.randint(15, 70),               # 0-100 范围
    }


def publish_telemetry(client: mqtt.Client):
    with state_lock:
        params = {
            **fake_sensors(),
            "led": state["led"],
            "pwq": state["pwq"],
            "csb": state["csb"],
        }

    payload = {
        "id":      next_msg_id(),
        "version": "1.0",
        "params":  {k: {"value": v} for k, v in params.items()},
        "method":  "thing.event.property.post",
    }
    body = json.dumps(payload, separators=(",", ":"))
    rc = client.publish(TOPIC_PROP_POST, body, qos=0)
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] ↑ telemetry  rc={rc.rc} "
          f"temp={params['temp']}°C humi={params['humi']}% pm25={params['PM25']} "
          f"led={params['led']} pwq={params['pwq']} csb={params['csb']}")


# ============ 接收下行 ============

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✓ MQTT 已连接 {MQTT_HOST}:{MQTT_PORT}")
        client.subscribe(TOPIC_PROP_SET, qos=0)
        client.subscribe(TOPIC_PROP_POST_REPLY, qos=0)
        print(f"✓ 订阅: {TOPIC_PROP_SET}")
        print(f"✓ 订阅: {TOPIC_PROP_POST_REPLY}")
    else:
        print(f"❌ MQTT 连接失败 rc={rc}")
        # 常见 rc:
        #   1 = 不被接受的协议版本
        #   2 = ClientId 被拒
        #   3 = 服务不可用
        #   4 = 用户名密码错(签名错)
        #   5 = 未授权(三元组不对)


def on_message(client, userdata, msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] ↓ {msg.topic}")
    print(f"     {msg.payload.decode('utf-8', errors='replace')}")

    if msg.topic == TOPIC_PROP_SET:
        try:
            data = json.loads(msg.payload.decode("utf-8"))
        except json.JSONDecodeError:
            print("     ⚠️ 非法 JSON, 丢弃")
            return

        params = data.get("params") or {}
        changed = []
        with state_lock:
            for k in ("led", "pwq", "csb"):
                if k in params:
                    new_val = 1 if params[k] in (1, True, "1", "true") else 0
                    if state[k] != new_val:
                        state[k] = new_val
                        changed.append(f"{k}={new_val}")

        if changed:
            print(f"     → 已应用: {', '.join(changed)}")
        # 应答(可省。Aliyun 不强制设备 reply set_reply)
        reply = {
            "id":      data.get("id", "0"),
            "code":    200,
            "data":    {},
        }
        client.publish(TOPIC_PROP_SET_REPLY, json.dumps(reply), qos=0)


def on_disconnect(client, userdata, rc):
    print(f"⚠️ MQTT 已断开 rc={rc} (paho 会自动重连)")


# ============ 入口 ============

def main():
    print("─" * 60)
    print(f"  ProductKey   : {PK}")
    print(f"  DeviceName   : {DN}")
    print(f"  MQTT host    : {MQTT_HOST}:{MQTT_PORT}")
    print(f"  ClientID     : {CLIENT_ID}")
    print(f"  Username     : {USERNAME}")
    print(f"  Password     : {PASSWORD[:16]}... (HMAC-SHA1, 已隐藏后半)")
    print("─" * 60)

    # paho-mqtt 2.x 需要显式声明 callback API 版本;V1 保持旧式回调签名
    try:
        client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id=CLIENT_ID, clean_session=True,
        )
    except AttributeError:
        # paho-mqtt 1.x 回退
        client = mqtt.Client(client_id=CLIENT_ID, clean_session=True)
    client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect    = on_connect
    client.on_message    = on_message
    client.on_disconnect = on_disconnect
    client.reconnect_delay_set(min_delay=1, max_delay=60)

    print(f"... 正在连接 {MQTT_HOST}:{MQTT_PORT}")
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)

    client.loop_start()

    # Ctrl+C 优雅退出
    stop = threading.Event()
    signal.signal(signal.SIGINT,  lambda *_: stop.set())
    signal.signal(signal.SIGTERM, lambda *_: stop.set())

    try:
        while not stop.is_set():
            publish_telemetry(client)
            stop.wait(3.0)            # 每 3s 上报一次(对齐 mqtt_task)
    finally:
        print("\n... 退出中")
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
