import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

import { env } from '../lib/env.js';
import type { AccessTokenPayload } from '../types/auth.js';

declare module 'express-serve-static-core' {
    interface Request {
        user?: { sub: string };
    }
}

function parseBearer(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    const [typ, token] = authHeader.split(' ');
    if (typ?.toLowerCase() !== 'bearer') return null;
    return token || null;
}

export function requireAuth(): RequestHandler {
    return (req, _res, next) => {
        const token = parseBearer(req.header('authorization'));
        if (!token) return next(createHttpError(401, 'missing_auth'));

        try {
            const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
            if (payload.typ !== 'access') return next(createHttpError(401, 'invalid_token'));
            req.user = { sub: payload.sub };
            return next();
        } catch {
            return next(createHttpError(401, 'invalid_token'));
        }
    };
}
