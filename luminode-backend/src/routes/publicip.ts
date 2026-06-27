import { Router } from 'express';

const router = Router();

let cached: { ip: string | null; at: number; err?: string } = { ip: null, at: 0 };
const TTL_MS = 10 * 60 * 1000; // 10 分钟

async function tryFetch(url: string, timeoutMs = 4000): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    // 不少回显服务对 default Node UA 会返回 HTML 页或拒绝,伪装成 curl
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'curl/8.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ip = (await r.text()).trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) throw new Error(`bad ip: ${ip}`);
    return ip;
  } finally {
    clearTimeout(t);
  }
}

async function fetchPublicIp(): Promise<string> {
  // 多家容灾,国内可达性优先
  const sources = ['https://ifconfig.me/ip', 'https://ipv4.icanhazip.com', 'https://ipinfo.io/ip'];
  let lastErr: any;
  for (const u of sources) {
    try {
      return await tryFetch(u);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('all sources failed');
}

router.get('/', async (_req, res) => {
  const now = Date.now();
  if (cached.ip && now - cached.at < TTL_MS) {
    return res.json({ ip: cached.ip, cached: true, ageMs: now - cached.at });
  }
  try {
    const ip = await fetchPublicIp();
    cached = { ip, at: now };
    res.json({ ip, cached: false });
  } catch (e: any) {
    console.error('[publicip] fail:', e?.message, '|', e?.cause?.message, '|', e?.cause?.code);
    cached.err = String(e?.message ?? e);
    res.status(503).json({ ip: cached.ip, error: cached.err, ageMs: now - cached.at });
  }
});

export default router;
