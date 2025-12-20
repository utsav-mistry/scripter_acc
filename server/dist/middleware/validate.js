import createHttpError from '../lib/httpError.js';
export function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success)
            return next(createHttpError(400, 'invalid_body'));
        req.body = parsed.data;
        next();
    };
}
