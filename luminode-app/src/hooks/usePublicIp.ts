import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getPublicIp } from '../api/devices';

/** 后端缓存 10 分钟,App 每 5 分钟拉一次足够。 */
export function usePublicIp(intervalMs = 5 * 60 * 1000) {
  const [ip, setIp] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = async () => {
    try {
      const r = await getPublicIp();
      if (!mountedRef.current) return;
      if (r.ip) setIp(r.ip);
    } catch {
      // 静默失败,header 显示 "—" 即可
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, intervalMs);
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') fetchOnce();
    });
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [intervalMs]);

  return ip;
}
