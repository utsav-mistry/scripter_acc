import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) return next(createHttpError(400, 'invalid_body'));
        req.body = parsed.data;
        next();
    };
}
