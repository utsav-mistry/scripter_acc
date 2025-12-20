import { Router } from 'express';
import mongoose from 'mongoose';

import createHttpError from '../lib/httpError.js';
import { requireAuth } from '../middleware/auth.js';
import { idempotency } from '../middleware/idempotency.js';
import { NotificationModel } from '../schemas/notification.js';
import { requireRecord, requireStringMinMax, optionalCoerceInt } from '../lib/validate.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth());

function parseListQuery(q: any) {
  const limit = optionalCoerceInt(q?.limit, 'invalid_query');
  const cursor = typeof q?.cursor === 'string' ? q.cursor : undefined;
  const unreadOnly = typeof q?.unreadOnly === 'string' ? q.unreadOnly === 'true' : false;
  const projectId = typeof q?.projectId === 'string' ? q.projectId : undefined;
  const orgId = typeof q?.orgId === 'string' ? q.orgId : undefined;
  if (limit !== undefined && (limit < 1 || limit > 200)) throw createHttpError(400, 'invalid_query');
  return { limit: limit ?? 50, cursor, unreadOnly, projectId, orgId };
}

notificationsRouter.get('/', async (req, res) => {
  const { limit, cursor, unreadOnly, projectId, orgId } = parseListQuery(req.query);
  const userId = new mongoose.Types.ObjectId(req.user!.sub);

  const filter: any = { userId };
  if (unreadOnly) filter.readAt = { $exists: false };
  if (projectId) filter.projectId = new mongoose.Types.ObjectId(projectId);
  if (orgId) filter.orgId = new mongoose.Types.ObjectId(orgId);

  if (cursor) {
    const [msStr, idStr] = cursor.split('_');
    const ms = Number(msStr);
    if (!Number.isFinite(ms) || !idStr) throw createHttpError(400, 'invalid_cursor');
    filter.$or = [
      { createdAt: { $lt: new Date(ms) } },
      { createdAt: new Date(ms), _id: { $lt: new mongoose.Types.ObjectId(idStr) } }
    ];
  }

  const docs = await NotificationModel.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit);
  const last = docs.length ? (docs[docs.length - 1] as any) : null;
  const nextCursor = last ? `${new Date(last.createdAt).getTime()}_${String(last._id)}` : null;

  res.json({
    items: docs.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      body: n.body,
      payload: n.payload,
      readAt: n.readAt,
      createdAt: (n as any).createdAt
    })),
    nextCursor
  });
});

notificationsRouter.post('/mark-read', idempotency(), async (req, res) => {
  const o = requireRecord(req.body);
  const id = requireStringMinMax(o.id, 1, 200);

  const userId = new mongoose.Types.ObjectId(req.user!.sub);
  await NotificationModel.updateOne({ _id: new mongoose.Types.ObjectId(id), userId }, { $set: { readAt: new Date() } });
  res.json({ ok: true });
});

// SSE stream: polls DB for new notifications every 2s.
// Query: since=<createdAtMs> (optional)
notificationsRouter.get('/stream', async (req, res) => {
  res.setHeader('content-type', 'text/event-stream');
  res.setHeader('cache-control', 'no-cache');
  res.setHeader('connection', 'keep-alive');

  const userId = new mongoose.Types.ObjectId(req.user!.sub);
  let since = typeof req.query.since === 'string' ? Number(req.query.since) : 0;
  if (!Number.isFinite(since)) since = 0;

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const tick = async () => {
    if (closed) return;
    const filter: any = { userId };
    if (since > 0) filter.createdAt = { $gt: new Date(since) };

    const docs = await NotificationModel.find(filter).sort({ createdAt: 1 }).limit(50);
    for (const d of docs) {
      const createdAt = new Date((d as any).createdAt).getTime();
      since = Math.max(since, createdAt);
      res.write(`event: notification\n`);
      res.write(`data: ${JSON.stringify({
        id: d._id,
        type: d.type,
        title: d.title,
        body: d.body,
        payload: d.payload,
        readAt: d.readAt,
        createdAt: (d as any).createdAt
      })}\n\n`);
    }
    res.write(`event: heartbeat\n`);
    res.write(`data: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  };

  const interval = setInterval(() => {
    void tick().catch(() => {
      // ignore
    });
  }, 2000);

  // immediate first tick
  void tick().catch(() => {
    // ignore
  });

  req.on('close', () => {
    clearInterval(interval);
  });
});
