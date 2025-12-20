import { Router } from 'express';
import createHttpError from '../lib/httpError.js';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/projectAccess.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';

import { ProjectModel } from '../schemas/project.js';
import { WorkspaceModel } from '../schemas/workspace.js';
import { ProjectMemberModel } from '../schemas/projectMember.js';
import { OrgMemberModel, type OrgRole } from '../schemas/orgMember.js';
import { randomId } from '../lib/id.js';
import {
    optionalEnum,
    optionalRegex,
    optionalStringMinMax,
    requireEnum,
    requireRecord,
    requireStringMinMax,
    requireString
} from '../lib/validate.js';

export const projectRouter = Router();

type CreateProjectBody = {
    orgId: string;
    workspaceId: string;
    name: string;
    key?: string;
    description?: string;
    visibility?: 'private' | 'org';
};

type AddMemberBody = { userId: string; role: 'owner' | 'maintainer' | 'contributor' | 'viewer' };

function parseCreateProjectBody(input: unknown): CreateProjectBody {
    const o = requireRecord(input);
    const orgId = requireStringMinMax(o.orgId, 1, 200);
    const workspaceId = requireStringMinMax(o.workspaceId, 1, 200);
    const name = requireStringMinMax(o.name, 2, 120);
    const key = optionalRegex(o.key, /^[A-Z][A-Z0-9]*$/, 'invalid_body');
    const keyFinal = key ? optionalStringMinMax(key, 2, 12) : undefined;
    const description = optionalStringMinMax(o.description, 0, 2000);
    const visibility = optionalEnum(o.visibility, ['private', 'org'] as const);
    return { orgId, workspaceId, name, key: keyFinal, description, visibility };
}

function parseAddMemberBody(input: unknown): AddMemberBody {
    const o = requireRecord(input);
    const userId = requireStringMinMax(o.userId, 1, 200);
    const role = requireEnum(o.role, ['owner', 'maintainer', 'contributor', 'viewer'] as const);
    return { userId, role };
}

function parseListProjectsQuery(q: any): { orgId: string; workspaceId: string } {
    const orgId = requireString(q?.orgId, 'missing_orgId');
    const workspaceId = requireString(q?.workspaceId, 'missing_workspaceId');
    if (!orgId || !workspaceId) throw createHttpError(400, 'missing_orgId');
    return { orgId, workspaceId };
}

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
    const { orgId, workspaceId } = parseListProjectsQuery(req.query);

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

projectRouter.post('/', idempotency(), validateBody(parseCreateProjectBody), async (req, res) => {
    const { orgId, workspaceId, name, description, visibility, key: requestedKey } = req.body as CreateProjectBody;
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

projectRouter.post('/:projectId/members', requireProjectRole('maintainer'), idempotency(), validateBody(parseAddMemberBody), async (req, res) => {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) throw createHttpError(404, 'project_not_found');

    const { userId, role } = req.body as AddMemberBody;
    const member = await ProjectMemberModel.create({
        orgId: project.orgId,
        projectId: project._id,
        userId: new mongoose.Types.ObjectId(String(userId)),
        role,
        status: 'active'
    });

    res.status(201).json({ id: member._id, userId: member.userId, role: member.role, status: member.status });
});
