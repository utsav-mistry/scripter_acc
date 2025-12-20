import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../lib/env.js';

export function globalRateLimiter(): RequestHandler {
    return rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: 'rate_limited' },
        keyGenerator: (req) => {
            const userPart = (req as any).user?.sub ? `u:${(req as any).user.sub}` : '';
            return `${userPart}|ip:${req.ip}`;
        }
    });
}
