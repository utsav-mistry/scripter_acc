import type { RequestHandler } from 'express';
import { nanoid } from 'nanoid';

export function requestIdMiddleware(): RequestHandler {
    return (req, res, next) => {
        const header = req.header('x-request-id');
        const id = header && header.length <= 128 ? header : nanoid();
        (req as any).requestId = id;
        res.setHeader('x-request-id', id);
        next();
    };
}
