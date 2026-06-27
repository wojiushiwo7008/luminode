import { Router } from 'express';
import { setDeviceProperty } from '../aliyun/openapi';
import { patchDeviceField } from '../db/repo';
import { ControlRequest } from '../types';

const router = Router();

router.post('/:dn/control', async (req, res) => {
  const dn = req.params.dn;
  const body = req.body as ControlRequest;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'body must be JSON object' });
    return;
  }

  const result = await setDeviceProperty(dn, body);

  if (result.error) {
    res.status(502).json(result);
    return;
  }

  // 乐观更新本地缓存(等下一帧上行确认)
  for (const k of result.accepted) {
    const v = (body as any)[k];
    if (v === 0 || v === 1) patchDeviceField(dn, k as any, v);
  }

  res.json(result);
});

export default router;
