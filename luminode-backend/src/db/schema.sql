-- Luminode 后端 · SQLite schema
-- telemetry_latest: 每设备最新一帧(详情页 / 卡片)
-- telemetry_history: 每轮上报追加一行,用于 24h 能耗曲线、告警时序

CREATE TABLE IF NOT EXISTS telemetry_latest (
  device_name TEXT PRIMARY KEY,
  product_key TEXT NOT NULL,
  last_seen   INTEGER NOT NULL,  -- unix ms
  temp        INTEGER,
  humi        INTEGER,
  wind        INTEGER,
  MQ2         INTEGER,
  PM25        INTEGER,
  led         INTEGER,            -- 0 / 1
  pwq         INTEGER,
  csb         INTEGER
);

CREATE TABLE IF NOT EXISTS telemetry_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_name TEXT NOT NULL,
  ts          INTEGER NOT NULL,
  temp        INTEGER,
  humi        INTEGER,
  wind        INTEGER,
  PM25        INTEGER,
  led         INTEGER,
  pwq         INTEGER,
  csb         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_hist_device_ts
  ON telemetry_history(device_name, ts);
