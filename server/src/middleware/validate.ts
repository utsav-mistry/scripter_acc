import type { RequestHandler } from 'express';
import createHttpError from '../lib/httpError.js';
import type { Validator } from '../lib/validate.js';

export function validateBody<T>(validator: Validator<T>): RequestHandler {
    return (req, _res, next) => {
        try {
            req.body = validator(req.body);
        } catch (err) {
            return next(err ?? createHttpError(400, 'invalid_body'));
        }
        next();
    };
}
