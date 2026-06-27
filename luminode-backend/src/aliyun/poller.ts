/**
 * OpenAPI 兜底通道 · QueryDevicePropertyStatus 轮询
 *
 * AMQP 服务端订阅在我这签名调不通(或者权限/UID 问题),先用 OpenAPI 5s 轮询代替。
 * 缺点:实时性差(轮询间隔级别);优点:跟 SetDeviceProperty 同一个 AccessKey,
 * 上行下行用同一套权限,验证简单。
 */
import IotClient, * as $iot from '@alicloud/iot20180120';
import * as $OpenApi from '@alicloud/openapi-client';
import { config } from '../config';
import { upsertFromPropertyPost } from '../db/repo';
import { AliyunPropertyPostBody } from '../types';

export interface PollerStatus {
  running: boolean;
  lastError?: string;
  lastPollAt?: number;
  pollCount: number;
}

const status: PollerStatus = {
  running: false,
  pollCount: 0,
};

export function getPollerStatus(): PollerStatus {
  return { ...status };
}

let client: IotClient | null = null;
function getClient(): IotClient {
  if (client) return client;
  const c = new $OpenApi.Config({
    accessKeyId: config.openapi.accessKeyId,
    accessKeySecret: config.openapi.accessKeySecret,
  });
  c.endpoint = `iot.${config.region}.aliyuncs.com`;
  client = new IotClient(c);
  return client;
}

/**
 * 把 QueryDevicePropertyStatus 返回的 propertyStatusInfo[] 拍平成
 * 后端内部用的 AliyunPropertyPostBody 形式,直接喂给 upsertFromPropertyPost。
 */
function buildEnvelope(
  deviceName: string,
  info: Array<{ identifier?: string; value?: string; time?: string }>
): AliyunPropertyPostBody {
  const items: Record<string, { value: unknown; time?: number }> = {};
  for (const it of info) {
    if (!it.identifier) continue;
    items[it.identifier] = {
      value: it.value,
      time: it.time ? parseInt(it.time, 10) : undefined,
    };
  }
  return {
    productKey: config.productKey,
    deviceName,
    items,
  };
}

async function pollOnce(deviceName: string): Promise<void> {
  const req = new $iot.QueryDevicePropertyStatusRequest({
    iotInstanceId: config.iotInstanceId,
    productKey: config.productKey,
    deviceName,
  });
  const resp = await getClient().queryDevicePropertyStatus(req);
  const body = resp.body;
  if (!body?.success) {
    status.lastError = `${body?.code ?? '?'}: ${body?.errorMessage ?? 'unknown'}`;
    return;
  }
  const list = body.data?.list?.propertyStatusInfo ?? [];
  if (list.length === 0) {
    status.lastError = 'empty property list';
    return;
  }
  const envelope = buildEnvelope(deviceName, list);
  const t = upsertFromPropertyPost(envelope);
  status.lastError = undefined;
  console.log(
    `[poll] ↑ ${t.deviceName} ` +
      `temp=${t.temp ?? '-'} humi=${t.humi ?? '-'} pm25=${t.PM25 ?? '-'} ` +
      `wind=${t.wind ?? '-'} led=${t.led ?? '-'} pwq=${t.pwq ?? '-'} csb=${t.csb ?? '-'}`
  );
}

/**
 * 启动一个简单的轮询,目前硬编码就 lamp-A24 一个设备。
 * 后续要支持多设备:先 QueryDeviceList 拉名单,再各自 poll。
 */
export function startPoller(deviceNames: string[], intervalMs = 5000): void {
  status.running = true;
  console.log(`[poll] starting poller for ${deviceNames.join(', ')} every ${intervalMs}ms`);

  const tick = async () => {
    for (const dn of deviceNames) {
      try {
        await pollOnce(dn);
      } catch (e: any) {
        status.lastError = String(e?.message ?? e);
        console.warn(`[poll] ${dn} error: ${status.lastError}`);
      }
    }
    status.pollCount++;
    status.lastPollAt = Date.now();
  };

  // 启动时先打一次,然后定时
  void tick();
  setInterval(tick, intervalMs);
}
