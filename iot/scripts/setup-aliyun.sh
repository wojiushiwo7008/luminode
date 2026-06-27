#!/usr/bin/env bash
# Luminode · 阿里云 IoT 物联网平台资源初始化
#
# 前置:
#   1) 已注册阿里云账号,完成实名认证
#   2) 已开通"物联网平台"公共实例(免费),并记下 region(默认 cn-shanghai)
#   3) 已配置 aliyun-cli:`aliyun configure` 填好 AccessKey / Secret / Region
#   4) `source env.sh`(env.example.sh 复制改名后填好)
#
# 这个脚本会:
#   1) 创建产品 ($PRODUCT_NAME)
#   2) 导入 TSL ($TSL_FILE)
#   3) 发布物模型
#   4) 注册一个设备 ($DEVICE_NAME)
#   5) 查询设备三元组 (ProductKey / DeviceName / DeviceSecret)
#   6) 把三元组写回 env.sh
#
# 所有命令都是幂等的:重复跑会复用已存在的产品/设备(基于名字)。

set -euo pipefail

# --------- 工具 ---------
log()  { printf "\033[36m[setup]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[warn ]\033[0m %s\n" "$*"; }
die()  { printf "\033[31m[fail ]\033[0m %s\n" "$*" >&2; exit 1; }

command -v aliyun >/dev/null || die "未找到 aliyun-cli。请安装:https://help.aliyun.com/zh/cli/"
command -v jq     >/dev/null || die "未找到 jq。Windows 装 chocolatey 后 \`choco install jq\`,或下载 https://jqlang.github.io/jq/"

: "${ALIYUN_REGION:?未设置 ALIYUN_REGION,先 source env.sh}"
: "${PRODUCT_NAME:?}"; : "${DEVICE_NAME:?}"; : "${TSL_FILE:?}"
[[ -f "$TSL_FILE" ]] || die "TSL 文件不存在: $TSL_FILE"

# 阿里云 IoT 必须显式指定 endpoint,不然 CLI 会用默认弹性接口
IOT_ENDPOINT="iot.${ALIYUN_REGION}.aliyuncs.com"
ALI_FLAGS=(--region "$ALIYUN_REGION" --endpoint "$IOT_ENDPOINT" --output json)

# --------- 1. 查询产品是否已存在 ---------
log "step 1/5 · 查询/创建产品: $PRODUCT_NAME"

# QueryProductList 不支持按名字过滤,只能拉一页找。免费实例下产品数量不多,够用。
PK="$(aliyun iot QueryProductList "${ALI_FLAGS[@]}" \
        --PageSize 50 --CurrentPage 1 2>/dev/null \
      | jq -r --arg name "$PRODUCT_NAME" \
        '.Data.List.ProductInfo[]? | select(.ProductName==$name) | .ProductKey' \
      | head -n1 || true)"

if [[ -z "$PK" || "$PK" == "null" ]]; then
  log "  产品不存在,创建中..."
  CREATE_RESP="$(aliyun iot CreateProduct "${ALI_FLAGS[@]}" \
                  --ProductName "$PRODUCT_NAME" \
                  --NodeType "${NODE_TYPE:-0}" \
                  --DataFormat "${DATA_FORMAT:-1}" \
                  --NetType "${NET_TYPE:-1}" \
                  --AliyunCommodityCode "iothub_senior" \
                  --Description "${PRODUCT_DESC:-Luminode streetlight}")"
  PK="$(echo "$CREATE_RESP" | jq -r '.ProductKey')"
  [[ -n "$PK" && "$PK" != "null" ]] || die "创建产品失败: $CREATE_RESP"
  log "  ✓ 创建成功 ProductKey=$PK"
else
  log "  ✓ 已存在 ProductKey=$PK"
fi

# --------- 2. 导入 TSL ---------
log "step 2/5 · 导入物模型 TSL"

# TSL 里 productKey 字段需要替换占位符
TSL_RENDERED="$(mktemp -t tsl.XXXXXX.json)"
trap 'rm -f "$TSL_RENDERED"' EXIT
sed "s|\${PRODUCT_KEY}|$PK|g" "$TSL_FILE" > "$TSL_RENDERED"

aliyun iot ImportThingModelTsl "${ALI_FLAGS[@]}" \
  --ProductKey "$PK" \
  --TslStr "$(cat "$TSL_RENDERED")" \
  >/dev/null

log "  ✓ TSL 导入完成"

# --------- 3. 发布物模型 ---------
log "step 3/5 · 发布物模型"
aliyun iot PublishThingModel "${ALI_FLAGS[@]}" \
  --ProductKey "$PK" \
  --ModelVersion "1.0.0" \
  >/dev/null || warn "PublishThingModel 报错(可能版本已存在,可忽略)"
log "  ✓ 已发布 v1.0.0"

# --------- 4. 注册设备 ---------
log "step 4/5 · 查询/注册设备: $DEVICE_NAME"

DETAIL="$(aliyun iot QueryDeviceDetail "${ALI_FLAGS[@]}" \
            --ProductKey "$PK" --DeviceName "$DEVICE_NAME" 2>/dev/null || true)"
DEV_EXIST="$(echo "$DETAIL" | jq -r '.Success // false')"

if [[ "$DEV_EXIST" != "true" ]]; then
  log "  设备不存在,注册中..."
  aliyun iot RegisterDevice "${ALI_FLAGS[@]}" \
    --ProductKey "$PK" --DeviceName "$DEVICE_NAME" \
    --Nickname "${DEVICE_NICKNAME:-$DEVICE_NAME}" \
    >/dev/null
  DETAIL="$(aliyun iot QueryDeviceDetail "${ALI_FLAGS[@]}" \
              --ProductKey "$PK" --DeviceName "$DEVICE_NAME")"
fi

DEVICE_SECRET="$(echo "$DETAIL" | jq -r '.Data.DeviceSecret')"
PRODUCT_SECRET="$(aliyun iot QueryProduct "${ALI_FLAGS[@]}" \
                    --ProductKey "$PK" | jq -r '.Data.ProductSecret')"

[[ -n "$DEVICE_SECRET" && "$DEVICE_SECRET" != "null" ]] || die "查不到 DeviceSecret"
log "  ✓ DeviceName=$DEVICE_NAME"
log "  ✓ DeviceSecret=********(已隐藏,完整值在 env.sh)"

# --------- 5. 写回 env.sh ---------
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/env.sh"
if [[ -f "$ENV_FILE" ]]; then
  log "step 5/5 · 把三元组写回 $ENV_FILE"
  # 删除可能存在的旧值,再追加
  sed -i.bak \
    -e '/^export PRODUCT_KEY=/d' \
    -e '/^export PRODUCT_SECRET=/d' \
    -e '/^export DEVICE_SECRET=/d' \
    "$ENV_FILE"
  {
    echo ""
    echo "# 由 setup-aliyun.sh 自动写入 $(date +%F\ %T)"
    echo "export PRODUCT_KEY=\"$PK\""
    echo "export PRODUCT_SECRET=\"$PRODUCT_SECRET\""
    echo "export DEVICE_SECRET=\"$DEVICE_SECRET\""
  } >> "$ENV_FILE"
  log "  ✓ 已更新 env.sh(备份在 env.sh.bak)"
else
  warn "env.sh 不存在,跳过写回。三元组如下,请手工保存:"
  echo "  PRODUCT_KEY=$PK"
  echo "  PRODUCT_SECRET=$PRODUCT_SECRET"
  echo "  DEVICE_SECRET=$DEVICE_SECRET"
fi

# --------- 收尾 ---------
MQTT_HOST="${PK}.iot-as-mqtt.${ALIYUN_REGION}.aliyuncs.com"
cat <<EOF

────────────────────────────────────────────────────
✓ Luminode 阿里云资源就绪
────────────────────────────────────────────────────
  ProductKey   : $PK
  DeviceName   : $DEVICE_NAME
  MQTT 接入点   : $MQTT_HOST:1883
  控制台        : https://iot.console.aliyun.com/product/index/$ALIYUN_REGION

下一步:
  1. 验证云端通路:cd ../mock-device && python mock_lamp.py
  2. 生成固件凭证:python aliyun_creds_gen.py
  3. 移植固件:见 iot/README.md "Phase B"
EOF
