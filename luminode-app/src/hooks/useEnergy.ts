import { useCallback } from 'react';
import { usePoll } from './usePoll';
import { getEnergy } from '../api/devices';
import { EnergyResult } from '../api/types';

/** 能耗曲线 30s 轮询(变化慢,不需要更勤)。 */
export function useEnergy(deviceName: string, intervalMs = 30000) {
  const fetcher = useCallback(() => getEnergy(deviceName), [deviceName]);
  return usePoll<EnergyResult>(fetcher, intervalMs);
}
