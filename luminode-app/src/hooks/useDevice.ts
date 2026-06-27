import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getDevice } from '../api/devices';
import { DeviceSummary } from '../api/types';

interface UseDeviceState {
  data: DeviceSummary | null;
  loading: boolean;
  error: string | null;
}

/** 3 秒轮询一次后端 GET /devices/:dn。App 切到后台时暂停。 */
export function useDevice(deviceName: string, intervalMs = 3000) {
  const [state, setState] = useState<UseDeviceState>({
    data: null,
    loading: true,
    error: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    try {
      const data = await getDevice(deviceName);
      if (!mountedRef.current) return;
      setState({ data, loading: false, error: null });
    } catch (e: any) {
      if (!mountedRef.current) return;
      const msg = e?.message ?? 'fetch failed';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
    }
  }, [deviceName]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, intervalMs);
  }, [fetchOnce, intervalMs]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    start();

    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') start();
      else stop();
    });

    return () => {
      mountedRef.current = false;
      stop();
      sub.remove();
    };
  }, [start, stop]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchOnce,
  };
}
