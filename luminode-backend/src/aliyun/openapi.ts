/**
 * 下行控制 · 走 Aliyun OpenAPI SetDeviceProperty
 *
 * SDK 使用方法详见:https://help.aliyun.com/zh/iot/developer-reference/api-iot-2018-01-20-setdeviceproperty
 * 注意:
 * - endpoint:`iot.${region}.aliyuncs.com`(企业实例必须;公共实例也可工作)
 * - 公共实例需要传 IotInstanceId="iot-xxxx"
 * - Items 是一个 JSON 字符串,形如 '{"led":1,"pwq":0}'
 */
import IotClient, * as $iot from '@alicloud/iot20180120';
import * as $OpenApi from '@alicloud/openapi-client';
import { config } from '../config';
import { ControlRequest, ControlResult } from '../types';

const ALLOWED_KEYS = new Set(['led', 'pwq', 'csb']);

let client: IotClient | null = null;

function getClient(): IotClient {
  if (client) return client;
  const openConfig = new $OpenApi.Config({
    accessKeyId: config.openapi.accessKeyId,
    accessKeySecret: config.openapi.accessKeySecret,
  });
  openConfig.endpoint = `iot.${config.region}.aliyuncs.com`;
  client = new IotClient(openConfig);
  return client;
}

export async function setDeviceProperty(
  deviceName: string,
  payload: ControlRequest
): Promise<ControlResult> {
  const accepted: string[] = [];
  const rejected: string[] = [];
  const items: Record<string, number> = {};

  for (const [k, v] of Object.entries(payload)) {
    if (!ALLOWED_KEYS.has(k)) {
      rejected.push(k);
      continue;
    }
    if (v !== 0 && v !== 1) {
      rejected.push(k);
      continue;
    }
    items[k] = v;
    accepted.push(k);
  }

  if (accepted.length === 0) {
    return { accepted, rejected, error: 'no valid keys' };
  }

  const req = new $iot.SetDevicePropertyRequest({
    iotInstanceId: config.iotInstanceId,
    productKey: config.productKey,
    deviceName,
    items: JSON.stringify(items),
  });

  try {
    const resp = await getClient().setDeviceProperty(req);
    const body = resp.body;
    if (!body?.success) {
      return {
        accepted: [],
        rejected: accepted,
        error: `${body?.code ?? '?'}: ${body?.errorMessage ?? 'unknown'}`,
      };
    }
    return {
      messageId: body.data?.messageId,
      accepted,
      rejected,
    };
  } catch (e: any) {
    return {
      accepted: [],
      rejected: accepted,
      error: String(e?.message ?? e),
    };
  }
}
