/** 与 luminode-backend/src/types.ts 对齐 */

export interface DeviceSummary {
  deviceName: string;
  productKey: string;
  lastSeen: number;
  online: boolean;
  temp?: number;
  humi?: number;
  wind?: number;
  MQ2?: number;
  PM25?: number;
  led?: 0 | 1;
  pwq?: 0 | 1;
  csb?: 0 | 1;
  displayName?: string;
  block?: string;
  emoji?: string;
  kind?: string;
  coord?: { x: number; y: number };
}

export interface EnergyResult {
  deviceName: string;
  buckets: { hour: number; kwh: number; samples: number }[];
  todayKwh: number;
}

export type AlertSeverity = 'alarm' | 'warn' | 'maint';
export interface AlertItem {
  id: string;
  deviceName: string;
  sev: AlertSeverity;
  code: string;
  title: string;
  meta: string;
  ts: number;
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

export interface HealthStatus {
  ok: boolean;
  uplink: string;
  running: boolean;
  pollCount: number;
  lastPollAt?: number;
  lastError?: string;
  uptime: number;
}

export interface ControlRequest {
  led?: 0 | 1;
  pwq?: 0 | 1;
  csb?: 0 | 1;
}

export interface ControlResult {
  messageId?: string;
  accepted: string[];
  rejected: string[];
  error?: string;
}
