import { Router } from 'express';
import createHttpError from '../lib/httpError.js';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAccess.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { optionalEnum, requireRecord, requireStringMinMax } from '../lib/validate.js';

import { BoardModel } from '../schemas/board.js';
import { ProjectModel } from '../schemas/project.js';
import { writeAudit } from '../lib/audit.js';

export const boardRouter = Router();

type CreateBoardBody = { name: string; type?: 'kanban' | 'scrum' | 'backlog' };

function parseCreateBoardBody(input: unknown): CreateBoardBody {
    const o = requireRecord(input);
    const name = requireStringMinMax(o.name, 2, 80);
    const type = optionalEnum(o.type, ['kanban', 'scrum', 'backlog'] as const);
    return { name, type };
}

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
    validateBody(parseCreateBoardBody),
    async (req, res) => {
        const project = await ProjectModel.findById(req.params.projectId);
        if (!project) throw createHttpError(404, 'project_not_found');

        const userId = new mongoose.Types.ObjectId(req.user!.sub);
        const { name, type } = req.body as CreateBoardBody;

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
