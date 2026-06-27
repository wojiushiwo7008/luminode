import axios, { AxiosInstance } from 'axios';
import { getBaseUrl } from './config';

let instance: AxiosInstance | null = null;
let currentBase: string | null = null;

async function ensureClient(): Promise<AxiosInstance> {
  const base = await getBaseUrl();
  if (!instance || currentBase !== base) {
    instance = axios.create({
      baseURL: base,
      timeout: 3000,
      headers: { 'Content-Type': 'application/json' },
    });
    currentBase = base;
  }
  return instance;
}

/** 用户在 MeScreen 改了 baseURL 后调用,强制下次请求重建 axios */
export function resetClient() {
  instance = null;
  currentBase = null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const c = await ensureClient();
  const res = await c.get<T>(path);
  return res.data;
}

export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  const c = await ensureClient();
  const res = await c.post<T>(path, body);
  return res.data;
}

export async function apiPut<T, B = unknown>(path: string, body: B): Promise<T> {
  const c = await ensureClient();
  const res = await c.put<T>(path, body);
  return res.data;
}

/** 拿一个完整 URL,通常用于跨端点(比如 /export 是 text/csv 不是 JSON)。 */
export async function apiGetText(path: string): Promise<string> {
  const c = await ensureClient();
  const res = await c.get<string>(path, { responseType: 'text', transformResponse: (d) => d });
  return res.data;
}
