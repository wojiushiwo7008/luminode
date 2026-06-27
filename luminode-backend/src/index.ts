import express from 'express';
import cors from 'cors';
import os from 'os';
import { config } from './config';
import { initDb } from './db/repo';
import { startPoller, getPollerStatus } from './aliyun/poller';
import devicesRouter from './routes/devices';
import controlRouter from './routes/control';
import alertsRouter from './routes/alerts';
import configRouter from './routes/config';
import exportRouter from './routes/export';
import publicipRouter from './routes/publicip';

// 目前演示只有 lamp-A24 一个真设备
const POLL_DEVICES = ['lamp-A24'];

function main() {
  initDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    const s = getPollerStatus();
    res.json({
      ok: true,
      uplink: 'openapi-poll',
      running: s.running,
      pollCount: s.pollCount,
      lastPollAt: s.lastPollAt,
      lastError: s.lastError,
      uptime: process.uptime(),
    });
  });

  app.use('/devices', devicesRouter);
  app.use('/devices', controlRouter);
  app.use('/alerts', alertsRouter);
  app.use('/config', configRouter);
  app.use('/export', exportRouter);
  app.use('/publicip', publicipRouter);

  app.listen(config.port, () => {
    console.log(`[HTTP] listening :${config.port}`);
    const lan = collectLanIps();
    console.log('');
    console.log('  ╔════════════════════════════════════════════════╗');
    console.log('  ║       App 端 baseURL 填以下任一即可:           ║');
    console.log('  ╠════════════════════════════════════════════════╣');
    if (lan.length === 0) {
      console.log('  ║   (未检测到 LAN IP,请检查网络连接)            ║');
    } else {
      for (const { name, ip } of lan) {
        const url = `http://${ip}:${config.port}`;
        const pad = Math.max(0, 46 - url.length - name.length - 3);
        console.log(`  ║   ${url}  (${name})${' '.repeat(pad)}║`);
      }
    }
    console.log('  ║   http://localhost:' + config.port + '       (仅本机调试)            ║');
    console.log('  ╚════════════════════════════════════════════════╝');
    console.log('');
  });

  startPoller(POLL_DEVICES, 5000);
}

function collectLanIps(): Array<{ name: string; ip: string }> {
  const result: Array<{ name: string; ip: string }> = [];
  const ifs = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(ifs)) {
    if (!addrs) continue;
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal) {
        result.push({ name, ip: a.address });
      }
    }
  }
  // 优先 192/172/10 私网,把 169.254 链路本地排后面
  result.sort((a, b) => {
    const linkLocal = (ip: string) => ip.startsWith('169.254.') ? 1 : 0;
    return linkLocal(a.ip) - linkLocal(b.ip);
  });
  return result;
}

main();
