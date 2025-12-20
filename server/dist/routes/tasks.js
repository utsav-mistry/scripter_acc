import { Router } from 'express';
import express from 'express';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';
import { validateBody } from '../middleware/validate.js';
import { TaskModel } from '../schemas/task.js';
import { ProjectModel } from '../schemas/project.js';
import { BoardModel } from '../schemas/board.js';
import { ProjectMemberModel } from '../schemas/projectMember.js';
import { TaskCommentModel } from '../schemas/taskComment.js';
import { LabelModel } from '../schemas/label.js';
import { TaskLabelModel } from '../schemas/taskLabel.js';
import { AttachmentModel } from '../schemas/attachment.js';
import { writeAudit } from '../lib/audit.js';
import { sha256Base64 } from '../lib/hash.js';
import { ensureDir, taskAttachmentDir } from '../lib/storage.js';
export const taskRouter = Router();
taskRouter.use(requireAuth());
const projectRoleWeight = {
    owner: 4,
    maintainer: 3,
    contributor: 2,
    viewer: 1
};
async function assertProjectRole(userId, projectId, minRole) {
    const member = await ProjectMemberModel.findOne({
        projectId: new mongoose.Types.ObjectId(projectId),
        userId,
        status: 'active'
    });
    if (!member)
        throw createHttpError(403, 'forbidden');
    if (projectRoleWeight[member.role] < projectRoleWeight[minRole])
        throw createHttpError(403, 'forbidden');
    return member;
}
const listTasksQuery = z.object({
    projectId: z.string().min(1),
    boardId: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'canceled']).optional(),
    assigneeUserId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    cursor: z.string().optional()
});
const createTaskBody = z.object({
    projectId: z.string().min(1),
    boardId: z.string().min(1),
    title: z.string().min(2).max(200),
    description: z.string().max(10_000).optional(),
    status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'canceled']).optional(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    assigneeUserId: z.string().optional(),
    dueAt: z.string().datetime().optional()
});
const updateTaskBody = z.object({
    title: z.string().min(2).max(200).optional(),
    description: z.string().max(10_000).optional(),
    status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'canceled']).optional(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    assigneeUserId: z.string().nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    boardId: z.string().optional()
});
const createCommentBody = z.object({
    body: z.string().min(1).max(10_000)
});
const createLabelBody = z.object({
    name: z.string().min(1).max(50),
    color: z.string().min(3).max(32)
});
const attachLabelBody = z.object({
    labelId: z.string().min(1)
});
function parseCursor(cursor) {
    const [msStr, idStr] = cursor.split('_');
    const ms = Number(msStr);
    if (!Number.isFinite(ms) || !idStr)
        throw createHttpError(400, 'invalid_cursor');
    return { ms, idStr };
}
taskRouter.get('/', async (req, res) => {
    const parsed = listTasksQuery.safeParse(req.query);
    if (!parsed.success)
        throw createHttpError(400, 'invalid_query');
    const { projectId, boardId, status, assigneeUserId, limit, cursor } = parsed.data;
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, projectId, 'viewer');
    const filter = { projectId: new mongoose.Types.ObjectId(projectId) };
    if (boardId)
        filter.boardId = new mongoose.Types.ObjectId(boardId);
    if (status)
        filter.status = status;
    if (assigneeUserId)
        filter.assigneeUserId = new mongoose.Types.ObjectId(assigneeUserId);
    if (cursor) {
        const { ms, idStr } = parseCursor(cursor);
        filter.$or = [
            { createdAt: { $lt: new Date(ms) } },
            { createdAt: new Date(ms), _id: { $lt: new mongoose.Types.ObjectId(idStr) } }
        ];
    }
    const pageLimit = limit ?? 50;
    const docs = await TaskModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(pageLimit);
    const last = docs.length ? docs[docs.length - 1] : null;
    const nextCursor = last ? `${new Date(last.createdAt).getTime()}_${String(last._id)}` : null;
    res.json({
        items: docs.map((t) => ({
            id: t._id,
            projectId: t.projectId,
            boardId: t.boardId,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            assigneeUserId: t.assigneeUserId,
            dueAt: t.dueAt,
            createdAt: t.createdAt
        })),
        nextCursor
    });
});
taskRouter.post('/', idempotency(), validateBody(createTaskBody), async (req, res) => {
    const body = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, body.projectId, 'contributor');
    const project = await ProjectModel.findById(body.projectId);
    if (!project)
        throw createHttpError(404, 'project_not_found');
    const board = await BoardModel.findOne({ _id: new mongoose.Types.ObjectId(body.boardId), projectId: project._id });
    if (!board)
        throw createHttpError(404, 'board_not_found');
    const task = await TaskModel.create({
        orgId: project.orgId,
        workspaceId: project.workspaceId,
        projectId: project._id,
        boardId: board._id,
        title: body.title,
        description: body.description,
        status: body.status ?? 'todo',
        priority: body.priority ?? 3,
        assigneeUserId: body.assigneeUserId ? new mongoose.Types.ObjectId(body.assigneeUserId) : undefined,
        createdByUserId: userId,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined
    });
    writeAudit(req, {
        entityType: 'task',
        entityId: String(task._id),
        action: 'create',
        orgId: String(project.orgId),
        workspaceId: String(project.workspaceId),
        projectId: String(project._id),
        metadata: { title: task.title, boardId: String(task.boardId), status: task.status }
    });
    res.status(201).json({ id: task._id });
});
taskRouter.get('/:taskId', async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'viewer');
    res.json({
        id: task._id,
        projectId: task.projectId,
        boardId: task.boardId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeUserId: task.assigneeUserId,
        dueAt: task.dueAt,
        createdAt: task.createdAt
    });
});
taskRouter.patch('/:taskId', idempotency(), validateBody(updateTaskBody), async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'contributor');
    const patch = req.body;
    const update = {};
    if (patch.title !== undefined)
        update.title = patch.title;
    if (patch.description !== undefined)
        update.description = patch.description;
    if (patch.status !== undefined)
        update.status = patch.status;
    if (patch.priority !== undefined)
        update.priority = patch.priority;
    if (patch.assigneeUserId !== undefined) {
        update.assigneeUserId = patch.assigneeUserId ? new mongoose.Types.ObjectId(patch.assigneeUserId) : undefined;
    }
    if (patch.dueAt !== undefined)
        update.dueAt = patch.dueAt ? new Date(patch.dueAt) : undefined;
    if (patch.boardId !== undefined)
        update.boardId = new mongoose.Types.ObjectId(patch.boardId);
    await TaskModel.updateOne({ _id: task._id }, { $set: update });
    writeAudit(req, {
        entityType: 'task',
        entityId: String(task._id),
        action: 'update',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { update }
    });
    res.json({ ok: true });
});
taskRouter.get('/:taskId/comments', async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'viewer');
    const docs = await TaskCommentModel.find({ taskId: task._id }).sort({ createdAt: -1 }).limit(200);
    res.json({
        items: docs.map((c) => ({ id: c._id, body: c.body, createdByUserId: c.createdByUserId, createdAt: c.createdAt })),
        nextCursor: null
    });
});
taskRouter.post('/:taskId/comments', idempotency(), validateBody(createCommentBody), async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'contributor');
    const body = req.body;
    const comment = await TaskCommentModel.create({
        orgId: task.orgId,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        body: body.body,
        createdByUserId: userId
    });
    writeAudit(req, {
        entityType: 'task_comment',
        entityId: String(comment._id),
        action: 'create',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { taskId: String(task._id) }
    });
    res.status(201).json({ id: comment._id });
});
taskRouter.get('/projects/:projectId/labels', async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, req.params.projectId, 'viewer');
    const docs = await LabelModel.find({ projectId: new mongoose.Types.ObjectId(req.params.projectId) }).sort({ createdAt: -1 });
    res.json({
        items: docs.map((l) => ({ id: l._id, name: l.name, color: l.color })),
        nextCursor: null
    });
});
taskRouter.post('/projects/:projectId/labels', idempotency(), validateBody(createLabelBody), async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, req.params.projectId, 'maintainer');
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project)
        throw createHttpError(404, 'project_not_found');
    const body = req.body;
    const label = await LabelModel.create({
        orgId: project.orgId,
        projectId: project._id,
        name: body.name,
        color: body.color,
        createdByUserId: userId
    });
    writeAudit(req, {
        entityType: 'label',
        entityId: String(label._id),
        action: 'create',
        orgId: String(project.orgId),
        workspaceId: String(project.workspaceId),
        projectId: String(project._id),
        metadata: { name: label.name, color: label.color }
    });
    res.status(201).json({ id: label._id, name: label.name, color: label.color });
});
taskRouter.get('/:taskId/labels', async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'viewer');
    const joins = await TaskLabelModel.find({ taskId: task._id }).select({ labelId: 1 });
    const labelIds = joins.map((j) => j.labelId);
    const labels = await LabelModel.find({ _id: { $in: labelIds } });
    res.json({
        items: labels.map((l) => ({ id: l._id, name: l.name, color: l.color })),
        nextCursor: null
    });
});
taskRouter.post('/:taskId/labels', idempotency(), validateBody(attachLabelBody), async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'contributor');
    const { labelId } = req.body;
    const label = await LabelModel.findOne({ _id: new mongoose.Types.ObjectId(labelId), projectId: task.projectId });
    if (!label)
        throw createHttpError(404, 'label_not_found');
    const join = await TaskLabelModel.create({
        projectId: task.projectId,
        taskId: task._id,
        labelId: label._id,
        createdByUserId: userId
    });
    writeAudit(req, {
        entityType: 'label',
        entityId: String(label._id),
        action: 'update',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { taskId: String(task._id), op: 'attach', joinId: String(join._id) }
    });
    res.status(201).json({ ok: true });
});
taskRouter.delete('/:taskId/labels/:labelId', idempotency(), async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'contributor');
    await TaskLabelModel.deleteOne({ taskId: task._id, labelId: new mongoose.Types.ObjectId(req.params.labelId) });
    writeAudit(req, {
        entityType: 'label',
        entityId: req.params.labelId,
        action: 'update',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { taskId: String(task._id), op: 'detach' }
    });
    res.json({ ok: true });
});
taskRouter.get('/:taskId/attachments', async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'viewer');
    const docs = await AttachmentModel.find({ taskId: task._id }).sort({ createdAt: -1 });
    res.json({
        items: docs.map((a) => ({ id: a._id, filename: a.filename, contentType: a.contentType, sizeBytes: a.sizeBytes })),
        nextCursor: null
    });
});
taskRouter.post('/:taskId/attachments', idempotency(), express.raw({ type: 'application/octet-stream', limit: '25mb' }), async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'contributor');
    const filename = req.header('x-filename');
    if (!filename)
        throw createHttpError(400, 'missing_x_filename');
    const contentType = req.header('content-type') ?? 'application/octet-stream';
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0)
        throw createHttpError(400, 'empty_body');
    const sha = sha256Base64(buf.toString('base64'));
    const dir = taskAttachmentDir(String(task._id));
    await ensureDir(dir);
    const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
    const storagePath = path.join(dir, `${Date.now()}_${safeName}`);
    await fs.writeFile(storagePath, buf);
    const attachment = await AttachmentModel.create({
        orgId: task.orgId,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        taskId: task._id,
        filename: safeName,
        contentType,
        sizeBytes: buf.length,
        storagePath,
        sha256: sha,
        createdByUserId: userId
    });
    writeAudit(req, {
        entityType: 'attachment',
        entityId: String(attachment._id),
        action: 'upload',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { taskId: String(task._id), filename: safeName, sizeBytes: buf.length }
    });
    res.status(201).json({ id: attachment._id, filename: attachment.filename, sizeBytes: attachment.sizeBytes });
});
taskRouter.get('/:taskId/attachments/:attachmentId/download', async (req, res) => {
    const task = await TaskModel.findById(req.params.taskId);
    if (!task)
        throw createHttpError(404, 'task_not_found');
    const userId = new mongoose.Types.ObjectId(req.user.sub);
    await assertProjectRole(userId, String(task.projectId), 'viewer');
    const attachment = await AttachmentModel.findOne({
        _id: new mongoose.Types.ObjectId(req.params.attachmentId),
        taskId: task._id
    });
    if (!attachment)
        throw createHttpError(404, 'attachment_not_found');
    writeAudit(req, {
        entityType: 'attachment',
        entityId: String(attachment._id),
        action: 'download',
        orgId: String(task.orgId),
        workspaceId: String(task.workspaceId),
        projectId: String(task.projectId),
        metadata: { taskId: String(task._id) }
    });
    res.setHeader('content-type', attachment.contentType);
    res.setHeader('content-disposition', `attachment; filename="${attachment.filename}"`);
    const buf = await fs.readFile(attachment.storagePath);
    res.send(buf);
});
