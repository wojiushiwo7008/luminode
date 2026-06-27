import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface DeviceMeta {
  deviceName: string;
  displayName: string;
  block: string;
  emoji: string;
  kind: 'lamp' | 'fan' | 'sprayer' | string;
  coord: { x: number; y: number };
}

export interface AlertThresholds {
  offlineSec: number;
  tempHi: number;
  humiLo: number;
  humiHi: number;
  windHi: number;
  pm25Hi: number;
  pwqOnAsLeak: boolean;
  csbOnAsHazard: boolean;
}

function loadDevicesJson(): { devices: DeviceMeta[]; alerts: AlertThresholds } {
  const p = path.resolve(process.cwd(), 'config/devices.json');
  if (!fs.existsSync(p)) {
    console.warn(`[config] ${p} not found, using empty device list`);
    return {
      devices: [],
      alerts: {
        offlineSec: 30,
        tempHi: 35,
        humiLo: 20,
        humiHi: 90,
        windHi: 6,
        pm25Hi: 150,
        pwqOnAsLeak: false,
        csbOnAsHazard: false,
      },
    };
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return { devices: raw.devices ?? [], alerts: raw.alerts };
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`[config] missing env: ${key}`);
    process.exit(1);
  }
  return v;
}

function envOr(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(envOr('PORT', '3000'), 10),

  iotInstanceId: requireEnv('IOT_INSTANCE_ID'),
  productKey: requireEnv('PRODUCT_KEY'),
  region: envOr('ALIYUN_REGION', 'cn-shanghai'),

  // AMQP 相关字段当前不使用(走 OpenAPI 轮询),改成可选避免空 .env 启动失败
  amqp: {
    uid: envOr('ALIYUN_UID', ''),
    consumerGroupId: envOr('AMQP_CONSUMER_GROUP_ID', ''),
    clientId: envOr('AMQP_CLIENT_ID', `luminode-backend-${Date.now()}`),
    accessKeyId: envOr('ACCESS_KEY_ID', ''),
    accessKeySecret: envOr('ACCESS_KEY_SECRET', ''),
  },

  openapi: {
    accessKeyId: requireEnv('ACCESS_KEY_ID'),
    accessKeySecret: requireEnv('ACCESS_KEY_SECRET'),
  },

  sqlitePath: path.resolve(envOr('SQLITE_PATH', './data/luminode.db')),
  onlineThresholdSec: parseInt(envOr('ONLINE_THRESHOLD_SEC', '30'), 10),

  ...loadDevicesJson(),
};
