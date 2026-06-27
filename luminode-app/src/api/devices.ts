import { apiGet, apiGetText, apiPost, apiPut } from './client';
import {
  AlertItem,
  AlertThresholds,
  ControlRequest,
  ControlResult,
  DeviceSummary,
  EnergyResult,
  HealthStatus,
} from './types';

export async function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>('/healthz');
}

export async function getPublicIp(): Promise<{ ip: string | null; cached?: boolean; error?: string }> {
  return apiGet<{ ip: string | null; cached?: boolean; error?: string }>('/publicip');
}

export async function getAlertThresholds(): Promise<AlertThresholds> {
  return apiGet<AlertThresholds>('/config/alerts');
}

export async function putAlertThresholds(
  patch: Partial<AlertThresholds>
): Promise<AlertThresholds> {
  return apiPut<AlertThresholds, Partial<AlertThresholds>>('/config/alerts', patch);
}

export async function exportHistoryCsv(deviceName: string, hours = 24): Promise<string> {
  return apiGetText(
    `/export/history.csv?device=${encodeURIComponent(deviceName)}&hours=${hours}`
  );
}

export async function getDevice(deviceName: string): Promise<DeviceSummary> {
  return apiGet<DeviceSummary>(`/devices/${encodeURIComponent(deviceName)}`);
}

export async function listDevices(): Promise<DeviceSummary[]> {
  return apiGet<DeviceSummary[]>('/devices');
}

export async function getEnergy(deviceName: string): Promise<EnergyResult> {
  return apiGet<EnergyResult>(`/devices/${encodeURIComponent(deviceName)}/energy`);
}

export async function listAlerts(): Promise<AlertItem[]> {
  return apiGet<AlertItem[]>('/alerts');
}

export async function controlDevice(
  deviceName: string,
  payload: ControlRequest
): Promise<ControlResult> {
  return apiPost<ControlResult, ControlRequest>(
    `/devices/${encodeURIComponent(deviceName)}/control`,
    payload
  );
}
