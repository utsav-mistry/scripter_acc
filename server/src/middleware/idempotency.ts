import type { RequestHandler } from 'express';
import createHttpError from '../lib/httpError.js';
import mongoose from 'mongoose';

import { IdempotencyKeyModel } from '../schemas/idempotencyKey.js';
import { sha256Base64 } from '../lib/hash.js';

export function idempotency(options?: { ttlSeconds?: number; headerName?: string }): RequestHandler {
    const headerName = options?.headerName ?? 'idempotency-key';
    const ttlSeconds = options?.ttlSeconds ?? 60 * 60 * 24;

    return async (req, res, next) => {
        const key = req.header(headerName);
        if (!key) return next(createHttpError(400, 'missing_idempotency_key'));
        if (!req.user?.sub) return next(createHttpError(401, 'missing_auth'));

        const requestHash = sha256Base64(JSON.stringify({ body: req.body ?? null, query: req.query ?? null }));

        const userId = new mongoose.Types.ObjectId(req.user.sub);
        const method = req.method.toUpperCase();
        const path = req.baseUrl + req.path;
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

        const existing = await IdempotencyKeyModel.findOne({ userId, key, method, path });
        if (existing) {
            if (existing.requestHash !== requestHash) return next(createHttpError(409, 'idempotency_key_reused'));
            if (existing.state === 'completed') return res.status(existing.responseStatus ?? 200).json(existing.responseBody);
            return next(createHttpError(409, 'request_in_progress'));
        }

        try {
            await IdempotencyKeyModel.create({ userId, key, method, path, requestHash, expiresAt, state: 'in_progress' });
        } catch (err: any) {
            if (err?.code === 11000) {
                const nowExisting = await IdempotencyKeyModel.findOne({ userId, key, method, path });
                if (nowExisting?.state === 'completed') {
                    return res.status(nowExisting.responseStatus ?? 200).json(nowExisting.responseBody);
                }
                return next(createHttpError(409, 'request_in_progress'));
            }
            return next(err);
        }

        const originalJson = res.json.bind(res);
        res.json = ((body: any) => {
            void IdempotencyKeyModel.updateOne(
                { userId, key, method, path },
                { $set: { state: 'completed', responseStatus: res.statusCode, responseBody: body } }
            ).exec();
            return originalJson(body);
        }) as any;

        next();
    };
}
