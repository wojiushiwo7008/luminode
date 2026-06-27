/**
 * 后端 baseURL 管理
 * 默认走热点局域网 IP;用户可以在 MeScreen 改并存到 AsyncStorage。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'luminode.backendBaseUrl';
/** 腾讯云轻量(ap-singapore lhins-k2jokujx),Docker 跑在 3100;MeScreen 可改 */
export const DEFAULT_BASE_URL = 'http://43.156.51.236:3100';

let cached: string | null = null;

export async function getBaseUrl(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(KEY);
    cached = stored && stored.length > 0 ? stored : DEFAULT_BASE_URL;
  } catch {
    cached = DEFAULT_BASE_URL;
  }
  return cached;
}

export async function setBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, '');
  cached = trimmed.length > 0 ? trimmed : DEFAULT_BASE_URL;
  await AsyncStorage.setItem(KEY, cached);
}

/** 同步读快照(只在 baseURL 已经被预热后用) */
export function getCachedBaseUrl(): string {
  return cached ?? DEFAULT_BASE_URL;
}
