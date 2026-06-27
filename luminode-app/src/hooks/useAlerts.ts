import { useCallback } from 'react';
import { usePoll } from './usePoll';
import { listAlerts } from '../api/devices';
import { AlertItem } from '../api/types';

/** 告警 5s 轮询;后端是纯计算,延迟即"距上次 poll"。 */
export function useAlerts(intervalMs = 5000) {
  const fetcher = useCallback(() => listAlerts(), []);
  return usePoll<AlertItem[]>(fetcher, intervalMs);
}
