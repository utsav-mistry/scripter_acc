import { Router } from 'express';
export const projectRouter = Router();
projectRouter.get('/', async (_req, res) => {
    res.json({ items: [], nextCursor: null });
});
