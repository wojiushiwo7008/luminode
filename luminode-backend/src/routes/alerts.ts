import { Router } from 'express';
import { computeAlerts } from '../db/repo';

const router = Router();

router.get('/', (_req, res) => {
  res.json(computeAlerts());
});

export default router;
