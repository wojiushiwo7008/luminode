import { useCallback } from 'react';
import { usePoll } from './usePoll';
import { listDevices } from '../api/devices';
import { DeviceSummary } from '../api/types';

/** 列表 5s 轮询;细节页用 useDevice(单设备 3s)更勤。 */
export function useDevices(intervalMs = 5000) {
  const fetcher = useCallback(() => listDevices(), []);
  return usePoll<DeviceSummary[]>(fetcher, intervalMs);
}
