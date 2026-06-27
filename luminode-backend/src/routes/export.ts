import { Router } from 'express';
import Database from 'better-sqlite3';
import { config } from '../config';

const router = Router();

/**
 * GET /export/history.csv?device=lamp-A24&hours=24
 * 直接流 CSV 出去,header 字段对齐 telemetry_history 表。
 */
router.get('/history.csv', (req, res) => {
  const device = String(req.query.device ?? '');
  const hours = Math.max(1, Math.min(168, parseInt(String(req.query.hours ?? '24'), 10) || 24));
  if (!device) {
    res.status(400).type('text/plain').send('missing ?device=');
    return;
  }
  const since = Date.now() - hours * 3600 * 1000;

  const db = new Database(config.sqlitePath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT ts, temp, humi, wind, PM25, led, pwq, csb
       FROM telemetry_history
       WHERE device_name = ? AND ts >= ?
       ORDER BY ts ASC`
    )
    .all(device, since) as any[];
  db.close();

  const header = 'ts_iso,ts_ms,temp,humi,wind,PM25,led,pwq,csb';
  const lines = rows.map((r) => {
    const iso = new Date(r.ts).toISOString();
    return [
      iso,
      r.ts,
      r.temp ?? '',
      r.humi ?? '',
      r.wind ?? '',
      r.PM25 ?? '',
      r.led ?? '',
      r.pwq ?? '',
      r.csb ?? '',
    ].join(',');
  });

  const body = [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${device}_${hours}h.csv"`
  );
  res.send(body);
});

export default router;
