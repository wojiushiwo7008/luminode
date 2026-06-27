import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { config, AlertThresholds } from '../config';

const router = Router();

const DEVICES_JSON = path.resolve(process.cwd(), 'config/devices.json');

/** GET /config/alerts — 返回当前阈值(运行时内存里的) */
router.get('/alerts', (_req, res) => {
  res.json(config.alerts);
});

/**
 * PUT /config/alerts — 接收 partial 更新,合并到内存 + 写回 devices.json
 * 注意 config 是 export const,不能整体 reassign,所以用 Object.assign 原地改。
 */
router.put('/alerts', (req, res) => {
  const incoming = req.body as Partial<AlertThresholds>;
  if (!incoming || typeof incoming !== 'object') {
    res.status(400).json({ error: 'body must be a JSON object' });
    return;
  }

  // 白名单字段;客户端瞎传也只会改这些
  const ALLOWED = [
    'offlineSec', 'tempHi', 'humiLo', 'humiHi',
    'windHi', 'pm25Hi', 'pwqOnAsLeak', 'csbOnAsHazard',
  ] as const;

  const patch: Partial<AlertThresholds> = {};
  for (const k of ALLOWED) {
    if (k in incoming) (patch as any)[k] = (incoming as any)[k];
  }

  Object.assign(config.alerts, patch);

  // 写回 devices.json(保留 devices 数组)
  try {
    const raw = JSON.parse(fs.readFileSync(DEVICES_JSON, 'utf-8'));
    raw.alerts = { ...raw.alerts, ...patch };
    fs.writeFileSync(DEVICES_JSON, JSON.stringify(raw, null, 2));
  } catch (e: any) {
    res.status(500).json({ error: `failed to persist: ${e.message}` });
    return;
  }

  res.json(config.alerts);
});

export default router;
