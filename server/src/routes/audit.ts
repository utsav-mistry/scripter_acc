import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import { AuditLogModel } from '../schemas/auditLog.js';
import { OrgMemberModel, type OrgRole } from '../schemas/orgMember.js';
import { ProjectMemberModel, type ProjectRole } from '../schemas/projectMember.js';

export const auditRouter = Router();

const querySchema = z.object({
    orgId: z.string().optional(),
    projectId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    cursor: z.string().optional()
});

auditRouter.use(requireAuth());

const orgRoleWeight: Record<OrgRole, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };
const projectRoleWeight: Record<ProjectRole, number> = { owner: 4, maintainer: 3, contributor: 2, viewer: 1 };

async function assertOrgViewer(userId: mongoose.Types.ObjectId, orgId: string) {
    const member = await OrgMemberModel.findOne({
        orgId: new mongoose.Types.ObjectId(orgId),
        userId,
        status: 'active'
    });
    if (!member) throw createHttpError(403, 'forbidden');
    if (orgRoleWeight[member.role] < orgRoleWeight.viewer) throw createHttpError(403, 'forbidden');
}

async function assertProjectViewer(userId: mongoose.Types.ObjectId, projectId: string) {
    const member = await ProjectMemberModel.findOne({
        projectId: new mongoose.Types.ObjectId(projectId),
        userId,
        status: 'active'
    });
    if (!member) throw createHttpError(403, 'forbidden');
    if (projectRoleWeight[member.role] < projectRoleWeight.viewer) throw createHttpError(403, 'forbidden');
}

auditRouter.get('/', async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) throw createHttpError(400, 'invalid_query');

    const { orgId, projectId, limit, cursor } = parsed.data;
    if (!orgId && !projectId) throw createHttpError(400, 'missing_scope');

    const userId = new mongoose.Types.ObjectId(req.user!.sub);
    if (orgId) await assertOrgViewer(userId, orgId);
    if (projectId) await assertProjectViewer(userId, projectId);

    const pageLimit = limit ?? 50;
    const filter: any = {};
    if (orgId) filter.orgId = new mongoose.Types.ObjectId(orgId);
    if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId);

    if (cursor) {
        // cursor is createdAt ms + '_' + _id
        const [msStr, idStr] = cursor.split('_');
        const ms = Number(msStr);
        if (!Number.isFinite(ms) || !idStr) throw createHttpError(400, 'invalid_cursor');
        filter.$or = [
            { createdAt: { $lt: new Date(ms) } },
            { createdAt: new Date(ms), _id: { $lt: new mongoose.Types.ObjectId(idStr) } }
        ];
    }

    const docs = await AuditLogModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(pageLimit);
    const last = docs.length ? (docs[docs.length - 1] as any) : null;
    const nextCursor = last ? `${new Date(last.createdAt).getTime()}_${String(last._id)}` : null;

    res.json({
        items: docs.map((d) => ({
            id: d._id,
            ts: (d as any).createdAt,
            actorUserId: d.actorUserId,
            entityType: d.entityType,
            entityId: d.entityId,
            action: d.action,
            requestId: d.requestId,
            metadata: d.metadata
        })),
        nextCursor
    });
});
