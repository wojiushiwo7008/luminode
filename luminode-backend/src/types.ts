/**
 * 与物模型(iot/tsl/luminode-streetlight.tsl.json)对齐
 * - 读属性:temp / humi / wind / MQ2 / PM25
 * - 读写属性:led / pwq / csb
 */
export interface Telemetry {
  deviceName: string;
  productKey: string;
  lastSeen: number; // unix ms
  temp?: number;
  humi?: number;
  wind?: number;
  MQ2?: number;
  PM25?: number;
  led?: 0 | 1;
  pwq?: 0 | 1;
  csb?: 0 | 1;
}

export interface DeviceSummary extends Telemetry {
  online: boolean;
  displayName?: string;
  block?: string;
  emoji?: string;
  kind?: string;
  coord?: { x: number; y: number };
}

export type AlertSeverity = 'alarm' | 'warn' | 'maint';
export interface AlertItem {
  id: string;
  deviceName: string;
  sev: AlertSeverity;
  code: string;       // 'offline' | 'temp_hi' | 'pm25_hi' | 'wind_hi' | 'leak' | 'hazard' | 'humi_lo' | 'humi_hi'
  title: string;
  meta: string;
  ts: number;
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

/** 阿里云 AMQP 服务端订阅推送下来的"属性上报"消息体 */
export interface AliyunPropertyPostBody {
  productKey: string;
  deviceName: string;
  iotId?: string;
  gmtCreate?: number;
  messageId?: string | number;
  items: Record<string, { value: unknown; time?: number }>;
}
