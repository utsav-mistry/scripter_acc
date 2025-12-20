import { Router } from 'express';

export const orgRouter = Router();

orgRouter.get('/', async (_req, res) => {
    res.json({ items: [], nextCursor: null });
});
