import { Router } from 'express';
import { getDevice, listDevices, getEnergy24h } from '../db/repo';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listDevices());
});

router.get('/:dn', (req, res) => {
  const dev = getDevice(req.params.dn);
  if (!dev) {
    res.status(404).json({ error: `device ${req.params.dn} not seen yet` });
    return;
  }
  res.json(dev);
});

router.get('/:dn/energy', (req, res) => {
  // 暂时只支持 24h;range 参数预留
  res.json(getEnergy24h(req.params.dn));
});

export default router;
