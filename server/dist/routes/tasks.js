import { Router } from 'express';
export const taskRouter = Router();
taskRouter.get('/', async (_req, res) => {
    res.json({ items: [], nextCursor: null });
});
