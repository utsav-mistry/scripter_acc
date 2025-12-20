import { Router } from 'express';
import createHttpError from '../lib/httpError.js';
import mongoose from 'mongoose';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAccess.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';

import { ProjectModel } from '../schemas/project.js';
import { WorkspaceModel } from '../schemas/workspace.js';
import { ProjectMemberModel } from '../schemas/projectMember.js';
import { OrgMemberModel, type OrgRole } from '../schemas/orgMember.js';
import { randomId } from '../lib/id.js';

export const projectRouter = Router();

const createProjectBody = z.object({
    orgId: z.string().min(1),
    workspaceId: z.string().min(1),
    name: z.string().min(2).max(120),
    key: z
        .string()
        .min(2)
        .max(12)
        .regex(/^[A-Z][A-Z0-9]*$/)
        .optional(),
    description: z.string().max(2000).optional(),
    visibility: z.enum(['private', 'org']).optional()
});

const addMemberBody = z.object({
    userId: z.string().min(1),
    role: z.enum(['owner', 'maintainer', 'contributor', 'viewer'])
});

const listProjectsQuery = z.object({
    orgId: z.string().min(1),
    workspaceId: z.string().min(1)
});

function projectKeyFromName(name: string) {
    const cleaned = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 6);
    const base = cleaned.length >= 2 ? cleaned : `PRJ${cleaned}`;
    return base.slice(0, 10);
}

const orgRoleWeight: Record<OrgRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
};

async function assertOrgRole(userId: mongoose.Types.ObjectId, orgId: string, minRole: OrgRole) {
    const member = await OrgMemberModel.findOne({
        orgId: new mongoose.Types.ObjectId(String(orgId)),
        userId,
        status: 'active'
    });
    if (!member) throw createHttpError(403, 'forbidden');
    if (orgRoleWeight[member.role] < orgRoleWeight[minRole]) throw createHttpError(403, 'forbidden');
}

projectRouter.use(requireAuth());

projectRouter.get('/', async (req, res) => {
    const parsed = listProjectsQuery.safeParse(req.query);
    if (!parsed.success) throw createHttpError(400, 'missing_orgId');
    const { orgId, workspaceId } = parsed.data;

    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    await assertOrgRole(userId, orgId, 'viewer');

    const items = await ProjectModel.find({
        orgId: new mongoose.Types.ObjectId(String(orgId)),
        workspaceId: new mongoose.Types.ObjectId(String(workspaceId))
    }).sort({ createdAt: -1 });

    res.json({
        items: items.map((p) => ({ id: p._id, name: p.name, key: p.key, visibility: p.visibility })),
        nextCursor: null
    });
});

projectRouter.post('/', idempotency(), validateBody(createProjectBody), async (req, res) => {
    const { orgId, workspaceId, name, description, visibility } = req.body as z.infer<typeof createProjectBody>;
    const requestedKey = (req.body as any).key as string | undefined;
    const keyBase = requestedKey ? requestedKey : projectKeyFromName(name);
    const key = keyBase.length >= 2 ? keyBase : `PRJ${randomId(3).toUpperCase()}`;

    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    await assertOrgRole(userId, orgId, 'member');

    const ws = await WorkspaceModel.findOne({
        _id: new mongoose.Types.ObjectId(String(workspaceId)),
        orgId: new mongoose.Types.ObjectId(String(orgId))
    });
    if (!ws) throw createHttpError(404, 'workspace_not_found');

    const project = await ProjectModel.create({
        orgId: new mongoose.Types.ObjectId(String(orgId)),
        workspaceId: new mongoose.Types.ObjectId(String(workspaceId)),
        name,
        key,
        description,
        visibility: visibility ?? 'org',
        createdByUserId: userId
    });

    await ProjectMemberModel.create({
        orgId: new mongoose.Types.ObjectId(String(orgId)),
        projectId: project._id,
        userId,
        role: 'owner',
        status: 'active'
    });

    res.status(201).json({ id: project._id, name: project.name, key: project.key });
});

projectRouter.get('/:projectId', requireProjectRole('viewer'), async (req, res) => {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) throw createHttpError(404, 'project_not_found');
    res.json({ id: project._id, orgId: project.orgId, workspaceId: project.workspaceId, name: project.name, key: project.key });
});

projectRouter.get('/:projectId/members', requireProjectRole('viewer'), async (req, res) => {
    const projectId = new mongoose.Types.ObjectId(req.params.projectId);
    const items = await ProjectMemberModel.find({ projectId, status: 'active' }).sort({ createdAt: -1 });
    res.json({
        items: items.map((m) => ({ id: m._id, userId: m.userId, role: m.role, status: m.status })),
        nextCursor: null
    });
});

projectRouter.post('/:projectId/members', requireProjectRole('maintainer'), idempotency(), validateBody(addMemberBody), async (req, res) => {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) throw createHttpError(404, 'project_not_found');

    const { userId, role } = req.body as z.infer<typeof addMemberBody>;
    const member = await ProjectMemberModel.create({
        orgId: project.orgId,
        projectId: project._id,
        userId: new mongoose.Types.ObjectId(String(userId)),
        role,
        status: 'active'
    });

    res.status(201).json({ id: member._id, userId: member.userId, role: member.role, status: member.status });
});
