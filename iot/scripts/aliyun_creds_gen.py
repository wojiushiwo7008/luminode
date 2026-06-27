#!/usr/bin/env python3
"""
Luminode · 阿里云 IoT MQTT 凭证生成器(离线)

为什么需要这个工具
------------------
阿里云 IoT MQTT 直连要三件套:
  ClientID = <自定义 ID>|securemode=2,signmethod=hmacsha1,timestamp=<13 位毫秒>|
  Username = <DeviceName>&<ProductKey>
  Password = HMAC-SHA1( "clientId<id>deviceName<dn>productKey<pk>timestamp<ts>",
                       key=DeviceSecret )

CH32V307 上做 HMAC-SHA1 是可以,但增加 ~3KB Flash + 一次性硬编码外加签名
更稳定可测试(且不占运行时栈)。我们用一个**远期 timestamp**(2050 年),
等于该签名在 2050 年前一直有效。

用法
----
  source env.sh        # 确保 PRODUCT_KEY / DEVICE_NAME / DEVICE_SECRET 已设
  python aliyun_creds_gen.py

  # 或者命令行直接传参,不走 env:
  python aliyun_creds_gen.py --pk a1xxx --dn lamp-A24 --secret xxx

输出
----
  1. 标准输出打印 ClientID / Username / Password / MQTT host
  2. 写文件 firmware-ch32/aliyun_creds.h(可被 CH32 工程 include)
"""

from __future__ import annotations
import argparse
import hashlib
import hmac
import os
import sys
import time
from pathlib import Path

# --- 远期 timestamp:2050-01-01 00:00:00 UTC,毫秒 ---
FAR_FUTURE_TS_MS = 2524608000000

# --- 自定义 ClientID 前缀(可任意,只是给设备一个友好名) ---
CLIENT_ID_PREFIX = "luminode"

REGION_DEFAULT = "cn-shanghai"


def hmac_sha1(secret: str, content: str) -> str:
    """Aliyun 签名:HMAC-SHA1,输出十六进制小写"""
    return hmac.new(
        secret.encode("utf-8"),
        content.encode("utf-8"),
        hashlib.sha1,
    ).hexdigest()


def build_credentials(pk: str, dn: str, ds: str, region: str, ts_ms: int):
    """返回 (clientId, username, password, mqtt_host)"""
    client_inner = f"{CLIENT_ID_PREFIX}-{dn}"
    # 注:阿里云签名的 clientId 字段是"内部 clientId",不包含 |securemode...|
    sign_content = (
        f"clientId{client_inner}"
        f"deviceName{dn}"
        f"productKey{pk}"
        f"timestamp{ts_ms}"
    )
    password = hmac_sha1(ds, sign_content)

    client_id_full = f"{client_inner}|securemode=2,signmethod=hmacsha1,timestamp={ts_ms}|"
    username = f"{dn}&{pk}"
    mqtt_host = f"{pk}.iot-as-mqtt.{region}.aliyuncs.com"

    return client_id_full, username, password, mqtt_host


def write_header(out_path: Path, pk, dn, region, client_id, username, password, mqtt_host, ts_ms):
    """生成可被 CH32 工程 #include 的 C 头文件"""
    header = f"""/*
 * aliyun_creds.h  -- 由 aliyun_creds_gen.py 自动生成
 *
 * ⚠️ 包含设备签名,请勿提交到公共仓库。
 * 生成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}
 * 签名有效期至: {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ts_ms / 1000))} UTC
 *               (timestamp={ts_ms})
 *
 * 用法(在 AIR724UG.c 顶部):
 *   #include "aliyun_creds.h"
 *   // 然后用 ALIYUN_MQTT_HOST / ALIYUN_CLIENT_ID / ALIYUN_USERNAME / ALIYUN_PASSWORD
 */

#ifndef ALIYUN_CREDS_H_
#define ALIYUN_CREDS_H_

/* 元信息(运行时无用,留作可读性) */
#define ALIYUN_PRODUCT_KEY   "{pk}"
#define ALIYUN_DEVICE_NAME   "{dn}"
#define ALIYUN_REGION        "{region}"

/* MQTT 接入点 */
#define ALIYUN_MQTT_HOST     "{mqtt_host}"
#define ALIYUN_MQTT_PORT     "1883"

/* MQTT 三件套 */
#define ALIYUN_CLIENT_ID     "{client_id}"
#define ALIYUN_USERNAME      "{username}"
#define ALIYUN_PASSWORD      "{password}"

/* 物模型 topic(系统级,固定模式,Aliyun 文档:
 *   /sys/{{productKey}}/{{deviceName}}/thing/...)
 * 已用 PK/DN 预拼好,避免运行时 sprintf 占栈 */
#define ALIYUN_TOPIC_PROP_POST       "/sys/{pk}/{dn}/thing/event/property/post"
#define ALIYUN_TOPIC_PROP_POST_REPLY "/sys/{pk}/{dn}/thing/event/property/post_reply"
#define ALIYUN_TOPIC_PROP_SET        "/sys/{pk}/{dn}/thing/service/property/set"
#define ALIYUN_TOPIC_PROP_SET_REPLY  "/sys/{pk}/{dn}/thing/service/property/set_reply"

#endif /* ALIYUN_CREDS_H_ */
"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(header, encoding="utf-8")
    print(f"  [OK] written to {out_path}")


def main():
    ap = argparse.ArgumentParser(description="Aliyun IoT MQTT 凭证生成器")
    ap.add_argument("--pk", default=os.environ.get("PRODUCT_KEY", ""),
                    help="ProductKey,默认读 $PRODUCT_KEY")
    ap.add_argument("--dn", default=os.environ.get("DEVICE_NAME", ""),
                    help="DeviceName,默认读 $DEVICE_NAME")
    ap.add_argument("--secret", default=os.environ.get("DEVICE_SECRET", ""),
                    help="DeviceSecret,默认读 $DEVICE_SECRET")
    ap.add_argument("--region", default=os.environ.get("ALIYUN_REGION", REGION_DEFAULT))
    ap.add_argument("--ts", type=int, default=FAR_FUTURE_TS_MS,
                    help=f"timestamp(毫秒),默认 {FAR_FUTURE_TS_MS}(2050 年)")
    ap.add_argument("--out", default=None,
                    help="输出 C 头文件路径,默认 ../firmware-ch32/aliyun_creds.h")
    args = ap.parse_args()

    if not args.pk or not args.dn or not args.secret:
        print("❌ 缺少 PK/DN/DeviceSecret。先 source env.sh 或用 --pk/--dn/--secret 传入", file=sys.stderr)
        sys.exit(1)

    client_id, username, password, mqtt_host = build_credentials(
        args.pk, args.dn, args.secret, args.region, args.ts
    )

    print("─" * 60)
    print(f"  ProductKey   : {args.pk}")
    print(f"  DeviceName   : {args.dn}")
    print(f"  Region       : {args.region}")
    print(f"  Timestamp    : {args.ts}  ({time.strftime('%Y-%m-%d', time.gmtime(args.ts/1000))} UTC)")
    print("─" * 60)
    print(f"  MQTT host    : {mqtt_host}:1883")
    print(f"  ClientID     : {client_id}")
    print(f"  Username     : {username}")
    print(f"  Password     : {password}")
    print("─" * 60)

    # 输出 C 头文件
    script_dir = Path(__file__).resolve().parent
    out_path = Path(args.out) if args.out else (script_dir / ".." / "firmware-ch32" / "aliyun_creds.h").resolve()
    write_header(out_path, args.pk, args.dn, args.region, client_id, username, password, mqtt_host, args.ts)

    print()
    print("[OK] credentials ready for mock_lamp.py and CH32 firmware")


if __name__ == "__main__":
    main()
