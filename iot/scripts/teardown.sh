#!/usr/bin/env bash
# Luminode · 阿里云 IoT 资源销毁
#
# ⚠️ 危险:会删除产品 + 全部子设备 + TSL 历史版本。
#         运行前请确认 PRODUCT_KEY 确实是你想删的那个。
#
# 用法:
#   source env.sh
#   ./teardown.sh                # 提示确认
#   ./teardown.sh --yes          # 跳过确认(慎用)

set -euo pipefail

log()  { printf "\033[36m[teardown]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[warn   ]\033[0m %s\n" "$*"; }
die()  { printf "\033[31m[fail   ]\033[0m %s\n" "$*" >&2; exit 1; }

: "${ALIYUN_REGION:?未 source env.sh}"
: "${PRODUCT_KEY:?env.sh 里没有 PRODUCT_KEY,无可删除}"
: "${DEVICE_NAME:?}"

IOT_ENDPOINT="iot.${ALIYUN_REGION}.aliyuncs.com"
ALI_FLAGS=(--region "$ALIYUN_REGION" --endpoint "$IOT_ENDPOINT" --output json)

# --------- 确认 ---------
SKIP_CONFIRM=0
[[ "${1:-}" == "--yes" ]] && SKIP_CONFIRM=1

cat <<EOF
即将删除:
  ProductKey   : $PRODUCT_KEY
  DeviceName   : $DEVICE_NAME (及该产品下的所有其他设备)
  Region       : $ALIYUN_REGION

此操作不可撤销。
EOF

if [[ $SKIP_CONFIRM -eq 0 ]]; then
  read -rp "输入 'DELETE' 大写确认: " CONFIRM
  [[ "$CONFIRM" == "DELETE" ]] || die "未确认,已中止"
fi

# --------- 1. 删除设备 ---------
log "step 1/2 · 删除设备 $DEVICE_NAME"
aliyun iot DeleteDevice "${ALI_FLAGS[@]}" \
  --ProductKey "$PRODUCT_KEY" \
  --DeviceName "$DEVICE_NAME" \
  >/dev/null 2>&1 || warn "DeleteDevice 失败/不存在,跳过"

# 拉一遍产品下所有设备,顺手删掉(避免后续删产品失败)
log "  扫描产品下其它设备..."
DEVICES_JSON="$(aliyun iot QueryDevice "${ALI_FLAGS[@]}" \
                  --ProductKey "$PRODUCT_KEY" \
                  --PageSize 50 --CurrentPage 1 2>/dev/null || echo '{}')"
echo "$DEVICES_JSON" | jq -r '.Data.DeviceInfo[]?.DeviceName' | while read -r dn; do
  [[ -z "$dn" || "$dn" == "null" ]] && continue
  log "    deleting $dn"
  aliyun iot DeleteDevice "${ALI_FLAGS[@]}" \
    --ProductKey "$PRODUCT_KEY" --DeviceName "$dn" >/dev/null 2>&1 || true
done

# --------- 2. 删除产品 ---------
log "step 2/2 · 删除产品 $PRODUCT_KEY"
aliyun iot DeleteProduct "${ALI_FLAGS[@]}" --ProductKey "$PRODUCT_KEY" \
  || warn "DeleteProduct 失败。若提示有遗留资源,先去控制台手工清理"

# --------- 清理 env.sh ---------
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/env.sh"
if [[ -f "$ENV_FILE" ]]; then
  sed -i.bak \
    -e '/^export PRODUCT_KEY=/d' \
    -e '/^export PRODUCT_SECRET=/d' \
    -e '/^export DEVICE_SECRET=/d' \
    -e '/^# 由 setup-aliyun.sh 自动写入/d' \
    "$ENV_FILE"
  log "已从 env.sh 清掉三元组(备份 env.sh.bak)"
fi

log "✓ 资源清理完毕"
