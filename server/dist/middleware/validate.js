import createHttpError from '../lib/httpError.js';
export function validateBody(validator) {
    return (req, _res, next) => {
        try {
            req.body = validator(req.body);
        }
        catch (err) {
            return next(err ?? createHttpError(400, 'invalid_body'));
        }
        next();
    };
}
