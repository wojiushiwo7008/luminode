import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { Telemetry, DeviceSummary, AliyunPropertyPostBody, AlertItem } from '../types';

// 物模型里所有标量字段名(必须跟 schema.sql 的列名一致)
const SCALAR_KEYS = ['temp', 'humi', 'wind', 'MQ2', 'PM25', 'led', 'pwq', 'csb'] as const;
type ScalarKey = (typeof SCALAR_KEYS)[number];

let db: Database.Database | null = null;

export function initDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(config.sqlitePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.sqlitePath);
  db.pragma('journal_mode = WAL');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log(`[db] opened ${config.sqlitePath}`);
  return db;
}

function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized; call initDb() first');
  return db;
}

/** 把 AMQP 推送的 items 转成 SQL UPSERT */
export function upsertFromPropertyPost(body: AliyunPropertyPostBody): Telemetry {
  const now = Date.now();
  const extracted: Partial<Record<ScalarKey, number>> = {};

  for (const key of SCALAR_KEYS) {
    const cell = body.items?.[key];
    if (cell == null) continue;
    const raw = cell.value;
    let num: number | undefined;
    if (typeof raw === 'number') num = raw;
    else if (typeof raw === 'boolean') num = raw ? 1 : 0;
    else if (typeof raw === 'string' && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) num = n;
    }
    if (num !== undefined) extracted[key] = num;
  }

  // 先取旧记录,合并到新值(只更新这一帧带的字段,其他保留)
  const existing = getDb()
    .prepare('SELECT * FROM telemetry_latest WHERE device_name = ?')
    .get(body.deviceName) as any | undefined;

  const merged: Telemetry = {
    deviceName: body.deviceName,
    productKey: body.productKey,
    lastSeen: now,
  };
  for (const key of SCALAR_KEYS) {
    const v = extracted[key] ?? existing?.[key] ?? undefined;
    if (v !== undefined && v !== null) (merged as any)[key] = v;
  }

  getDb()
    .prepare(
      `INSERT INTO telemetry_latest
       (device_name, product_key, last_seen, temp, humi, wind, MQ2, PM25, led, pwq, csb)
       VALUES (@deviceName, @productKey, @lastSeen, @temp, @humi, @wind, @MQ2, @PM25, @led, @pwq, @csb)
       ON CONFLICT(device_name) DO UPDATE SET
         product_key = excluded.product_key,
         last_seen   = excluded.last_seen,
         temp = COALESCE(excluded.temp, telemetry_latest.temp),
         humi = COALESCE(excluded.humi, telemetry_latest.humi),
         wind = COALESCE(excluded.wind, telemetry_latest.wind),
         MQ2  = COALESCE(excluded.MQ2,  telemetry_latest.MQ2),
         PM25 = COALESCE(excluded.PM25, telemetry_latest.PM25),
         led  = COALESCE(excluded.led,  telemetry_latest.led),
         pwq  = COALESCE(excluded.pwq,  telemetry_latest.pwq),
         csb  = COALESCE(excluded.csb,  telemetry_latest.csb)`
    )
    .run({
      deviceName: merged.deviceName,
      productKey: merged.productKey,
      lastSeen: merged.lastSeen,
      temp: merged.temp ?? null,
      humi: merged.humi ?? null,
      wind: merged.wind ?? null,
      MQ2: merged.MQ2 ?? null,
      PM25: merged.PM25 ?? null,
      led: merged.led ?? null,
      pwq: merged.pwq ?? null,
      csb: merged.csb ?? null,
    });

  // 追加历史一行(就用合并后的快照,字段不全也无所谓)
  getDb()
    .prepare(
      `INSERT INTO telemetry_history (device_name, ts, temp, humi, wind, PM25, led, pwq, csb)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      merged.deviceName,
      merged.lastSeen,
      merged.temp ?? null,
      merged.humi ?? null,
      merged.wind ?? null,
      merged.PM25 ?? null,
      merged.led ?? null,
      merged.pwq ?? null,
      merged.csb ?? null
    );

  return merged;
}

/**
 * 24 小时能耗:按小时分桶,每桶里 led=1 的样本占比 × 桶时长 × 额定功率 = kWh
 * 额定功率近似按 42W(LED 路灯)算,毕设演示用。
 */
export interface EnergyResult {
  deviceName: string;
  buckets: { hour: number; kwh: number; samples: number }[]; // 24 项,hour 是相对当前的偏移(0 = 现在那个小时,23 = 23 小时前)
  todayKwh: number;
}

const RATED_WATT = 42;

export function getEnergy24h(deviceName: string): EnergyResult {
  const now = Date.now();
  const start = now - 24 * 3600 * 1000;
  const rows = getDb()
    .prepare(
      `SELECT ts, led FROM telemetry_history
       WHERE device_name = ? AND ts >= ?
       ORDER BY ts ASC`
    )
    .all(deviceName, start) as { ts: number; led: number | null }[];

  // 24 个小时桶
  const buckets = Array.from({ length: 24 }, (_, i) => ({
    hour: 23 - i, // 0 = 当前小时
    kwh: 0,
    samples: 0,
    ledOnSamples: 0,
  }));

  for (const r of rows) {
    const ageMs = now - r.ts;
    const hourIdx = 23 - Math.floor(ageMs / 3600000); // 0..23 → 数组下标
    if (hourIdx < 0 || hourIdx > 23) continue;
    const b = buckets[hourIdx];
    b.samples++;
    if (r.led === 1) b.ledOnSamples++;
  }

  // 每桶: (ledOn / samples) * 1h * 42W / 1000 = kWh
  for (const b of buckets) {
    if (b.samples > 0) {
      b.kwh = +((b.ledOnSamples / b.samples) * (RATED_WATT / 1000)).toFixed(4);
    }
  }

  const todayKwh = +buckets.reduce((s, b) => s + b.kwh, 0).toFixed(3);

  return {
    deviceName,
    buckets: buckets.map(({ hour, kwh, samples }) => ({ hour, kwh, samples })),
    todayKwh,
  };
}

/** 单独写一个字段(下行确认后乐观更新本地缓存) */
export function patchDeviceField(deviceName: string, key: ScalarKey, value: number): void {
  // 仅当设备存在时更新,不主动创建(避免 control 早于上行落库)
  getDb()
    .prepare(`UPDATE telemetry_latest SET ${key} = ? WHERE device_name = ?`)
    .run(value, deviceName);
}

export function getDevice(deviceName: string): DeviceSummary | undefined {
  const row = getDb()
    .prepare('SELECT * FROM telemetry_latest WHERE device_name = ?')
    .get(deviceName) as any | undefined;
  if (!row) return undefined;
  return rowToSummary(row);
}

export function listDevices(): DeviceSummary[] {
  const rows = getDb()
    .prepare('SELECT * FROM telemetry_latest ORDER BY last_seen DESC')
    .all() as any[];
  const seen = new Set(rows.map((r) => r.device_name));
  const list = rows.map(rowToSummary);

  // devices.json 里配置了但还从来没上报过的:也列出来,标 offline
  for (const meta of config.devices) {
    if (seen.has(meta.deviceName)) continue;
    list.push({
      deviceName: meta.deviceName,
      productKey: config.productKey,
      lastSeen: 0,
      online: false,
      displayName: meta.displayName,
      block: meta.block,
      emoji: meta.emoji,
      kind: meta.kind,
      coord: meta.coord,
    });
  }
  return list;
}

/**
 * 阈值告警:扫一遍 telemetry_latest,按 devices.json 的 alerts 阈值生成 AlertItem。
 * 不入库,纯计算 — 每次 GET /alerts 都基于当时的最新一帧重算。
 */
export function computeAlerts(): AlertItem[] {
  const th = config.alerts;
  const now = Date.now();
  const result: AlertItem[] = [];

  const devices = listDevices();

  for (const d of devices) {
    const tag = d.displayName ?? d.deviceName;
    const block = d.block ?? '-';

    // offline
    if (!d.online) {
      result.push({
        id: `${d.deviceName}-offline`,
        deviceName: d.deviceName,
        sev: 'alarm',
        code: 'offline',
        title: `失联 · Offline`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen || now,
      });
      continue; // 离线了其他指标都不可信
    }

    if (d.temp != null && d.temp > th.tempHi) {
      result.push({
        id: `${d.deviceName}-temp_hi`,
        deviceName: d.deviceName,
        sev: 'warn',
        code: 'temp_hi',
        title: `温度过高 · ${d.temp}°C`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (d.humi != null && d.humi < th.humiLo) {
      result.push({
        id: `${d.deviceName}-humi_lo`,
        deviceName: d.deviceName,
        sev: 'warn',
        code: 'humi_lo',
        title: `湿度过低 · ${d.humi}%`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (d.humi != null && d.humi > th.humiHi) {
      result.push({
        id: `${d.deviceName}-humi_hi`,
        deviceName: d.deviceName,
        sev: 'warn',
        code: 'humi_hi',
        title: `湿度过高 · ${d.humi}%`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (d.wind != null && d.wind > th.windHi) {
      result.push({
        id: `${d.deviceName}-wind_hi`,
        deviceName: d.deviceName,
        sev: 'warn',
        code: 'wind_hi',
        title: `大风 · ${d.wind} 级`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (d.PM25 != null && d.PM25 > th.pm25Hi) {
      result.push({
        id: `${d.deviceName}-pm25_hi`,
        deviceName: d.deviceName,
        sev: 'warn',
        code: 'pm25_hi',
        title: `PM2.5 超标 · ${d.PM25} μg/m³`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (th.pwqOnAsLeak && d.pwq === 1) {
      result.push({
        id: `${d.deviceName}-leak`,
        deviceName: d.deviceName,
        sev: 'alarm',
        code: 'leak',
        title: `漏水告警 · Water leak`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
    if (th.csbOnAsHazard && d.csb === 1) {
      result.push({
        id: `${d.deviceName}-hazard`,
        deviceName: d.deviceName,
        sev: 'alarm',
        code: 'hazard',
        title: `可燃气体 · Combustible gas`,
        meta: `${tag} · ${block}`,
        ts: d.lastSeen,
      });
    }
  }

  // 严重度优先,然后按时间倒序
  const sevOrder: Record<string, number> = { alarm: 0, warn: 1, maint: 2 };
  result.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev] || b.ts - a.ts);
  return result;
}

function rowToSummary(row: any): DeviceSummary {
  const lastSeen = row.last_seen as number;
  const online = Date.now() - lastSeen < config.onlineThresholdSec * 1000;
  const meta = config.devices.find((d) => d.deviceName === row.device_name);
  return {
    deviceName: row.device_name,
    productKey: row.product_key,
    lastSeen,
    online,
    temp: row.temp ?? undefined,
    humi: row.humi ?? undefined,
    wind: row.wind ?? undefined,
    MQ2: row.MQ2 ?? undefined,
    PM25: row.PM25 ?? undefined,
    led: row.led ?? undefined,
    pwq: row.pwq ?? undefined,
    csb: row.csb ?? undefined,
    displayName: meta?.displayName,
    block: meta?.block,
    emoji: meta?.emoji,
    kind: meta?.kind,
    coord: meta?.coord,
  };
}
