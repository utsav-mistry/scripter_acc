import { Router } from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAccess.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';

import { BoardModel } from '../schemas/board.js';
import { ProjectModel } from '../schemas/project.js';
import { writeAudit } from '../lib/audit.js';

export const boardRouter = Router();

const createBoardBody = z.object({
    name: z.string().min(2).max(80),
    type: z.enum(['kanban', 'scrum', 'backlog']).optional()
});

boardRouter.use(requireAuth());

boardRouter.get('/projects/:projectId/boards', requireProjectRole('viewer'), async (req, res) => {
    const items = await BoardModel.find({ projectId: new mongoose.Types.ObjectId(req.params.projectId) }).sort({ createdAt: -1 });
    res.json({
        items: items.map((b) => ({ id: b._id, name: b.name, type: b.type })),
        nextCursor: null
    });
});

boardRouter.post(
    '/projects/:projectId/boards',
    requireProjectRole('contributor'),
    idempotency(),
    validateBody(createBoardBody),
    async (req, res) => {
        const project = await ProjectModel.findById(req.params.projectId);
        if (!project) throw createHttpError(404, 'project_not_found');

        const userId = new mongoose.Types.ObjectId(req.user!.sub);
        const { name, type } = req.body as z.infer<typeof createBoardBody>;

        const board = await BoardModel.create({
            orgId: project.orgId,
            workspaceId: project.workspaceId,
            projectId: project._id,
            name,
            type: type ?? 'kanban',
            createdByUserId: userId
        });

        writeAudit(req, {
            entityType: 'board',
            entityId: String(board._id),
            action: 'create',
            orgId: String(project.orgId),
            workspaceId: String(project.workspaceId),
            projectId: String(project._id),
            metadata: { name: board.name, type: board.type }
        });

        res.status(201).json({ id: board._id, name: board.name, type: board.type });
    }
);
