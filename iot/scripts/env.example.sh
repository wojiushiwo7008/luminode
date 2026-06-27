# 复制为 env.sh,填好后 `source ./env.sh`
# env.sh 已加入 .gitignore,切勿提交到仓库

# ---- 区域 ----
# 物联网平台公共实例:cn-shanghai
# 企业实例:你购买实例时选定的 region
export ALIYUN_REGION="cn-shanghai"

# ---- 产品 ----
export PRODUCT_NAME="Luminode-Streetlight"
export PRODUCT_DESC="智慧路灯 · Luminode (CH32V307 + AIR724UG)"
# 节点类型 0 = 设备,1 = 网关
export NODE_TYPE=0
# 数据格式:0 = 透传/自定义,1 = ICA 标准物模型(必须 1,才能用 TSL)
export DATA_FORMAT=1
# 联网方式:0 = WiFi, 1 = 蜂窝(2G/3G/4G/5G), 2 = 以太网, 3 = 其它
export NET_TYPE=1

# ---- 设备 ----
# 一个产品下可创建多个设备,DeviceName 必须在产品内唯一
export DEVICE_NAME="lamp-A24"
# 设备别名(可选,在控制台显示更友好)
export DEVICE_NICKNAME="A24 路灯 · 西街区"

# ---- 第一次运行会被脚本自动写回(setup-aliyun.sh 把创建出的 PK/Secret 追加进来) ----
# export PRODUCT_KEY=""
# export PRODUCT_SECRET=""
# export DEVICE_SECRET=""

# ---- TSL 文件路径 ----
export TSL_FILE="$(dirname "${BASH_SOURCE[0]}")/../tsl/luminode-streetlight.tsl.json"

# ---- MQTT 接入域名(由 ProductKey 拼出,创建产品后再用) ----
# 形如:<PK>.iot-as-mqtt.cn-shanghai.aliyuncs.com:1883
mqtt_host_of() {
  echo "${1}.iot-as-mqtt.${ALIYUN_REGION}.aliyuncs.com"
}
