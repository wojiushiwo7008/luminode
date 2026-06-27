import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UsePollState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * 通用轮询 hook:周期调用 fetcher,App 切后台时暂停。
 * 用 fetcherRef 避免每次 deps 变就重启 interval。
 */
export function usePoll<T>(fetcher: () => Promise<T>, intervalMs: number) {
  const [state, setState] = useState<UsePollState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchOnce = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      if (!mountedRef.current) return;
      setState({ data, loading: false, error: null });
    } catch (e: any) {
      if (!mountedRef.current) return;
      const msg = e?.message ?? 'fetch failed';
      setState((prev) => ({ ...prev, loading: false, error: msg }));
    }
  }, []);

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
