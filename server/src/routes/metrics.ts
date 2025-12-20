import { Router } from 'express';
import { snapshot } from '../lib/metrics.js';

export const metricsRouter = Router();

metricsRouter.get('/', (_req, res) => {
  res.json(snapshot());
});
