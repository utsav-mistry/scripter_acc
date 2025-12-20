import { Router } from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { OrgModel } from '../schemas/org.js';
import { OrgMemberModel } from '../schemas/orgMember.js';
import { WorkspaceModel } from '../schemas/workspace.js';
import { requireOrgRole } from '../middleware/orgAccess.js';
import { randomId } from '../lib/id.js';
export const orgRouter = Router();
const createOrgBody = z.object({
    name: z.string().min(2).max(80),
    slug: z
        .string()
        .min(2)
        .max(48)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    plan: z.enum(['free', 'pro', 'enterprise']).optional()
});
const createWorkspaceBody = z.object({
    name: z.string().min(2).max(80),
    key: z
        .string()
        .min(2)
        .max(12)
        .regex(/^[A-Z][A-Z0-9]*$/)
        .optional()
});
function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 48);
}
function workspaceKeyFromName(name) {
    const cleaned = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 6);
    const base = cleaned.length >= 2 ? cleaned : `WS${cleaned}`;
    return base.slice(0, 10);
}
orgRouter.use(requireAuth());
orgRouter.get('/', async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    const memberships = await OrgMemberModel.find({ userId, status: 'active' }).select({ orgId: 1, role: 1 });
    const orgIds = memberships.map((m) => m.orgId);
    const orgs = await OrgModel.find({ _id: { $in: orgIds } }).sort({ createdAt: -1 });
    res.json({
        items: orgs.map((o) => ({ id: o._id, name: o.name, slug: o.slug, plan: o.plan })),
        nextCursor: null
    });
});
orgRouter.post('/', idempotency(), validateBody(createOrgBody), async (req, res) => {
    const { name, plan } = req.body;
    const requestedSlug = req.body.slug;
    const slugBase = requestedSlug ? requestedSlug : slugify(name);
    const slug = slugBase.length >= 2 ? slugBase : `org-${randomId(4)}`;
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    const org = await OrgModel.create({ name, slug, plan: plan ?? 'free', createdByUserId: userId });
    await OrgMemberModel.create({ orgId: org._id, userId, role: 'owner', status: 'active' });
    res.status(201).json({ id: org._id, name: org.name, slug: org.slug, plan: org.plan });
});
orgRouter.get('/:orgId', requireOrgRole('viewer'), async (req, res) => {
    const org = await OrgModel.findById(req.params.orgId);
    if (!org)
        throw createHttpError(404, 'org_not_found');
    res.json({ id: org._id, name: org.name, slug: org.slug, plan: org.plan });
});
orgRouter.get('/:orgId/workspaces', requireOrgRole('viewer'), async (req, res) => {
    const orgId = new mongoose.Types.ObjectId(req.params.orgId);
    const items = await WorkspaceModel.find({ orgId }).sort({ createdAt: -1 });
    res.json({
        items: items.map((w) => ({ id: w._id, name: w.name, key: w.key })),
        nextCursor: null
    });
});
orgRouter.post('/:orgId/workspaces', requireOrgRole('member'), idempotency(), validateBody(createWorkspaceBody), async (req, res) => {
    const orgId = new mongoose.Types.ObjectId(req.params.orgId);
    const { name } = req.body;
    const requestedKey = req.body.key;
    const keyBase = requestedKey ? requestedKey : workspaceKeyFromName(name);
    const key = keyBase.length >= 2 ? keyBase : `WS${randomId(3).toUpperCase()}`;
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    const workspace = await WorkspaceModel.create({ orgId, name, key, createdByUserId: userId });
    res.status(201).json({ id: workspace._id, name: workspace.name, key: workspace.key });
});
