import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
function parseBearer(authHeader) {
    if (!authHeader)
        return null;
    const [typ, token] = authHeader.split(' ');
    if (typ?.toLowerCase() !== 'bearer')
        return null;
    return token || null;
}
export function requireAuth() {
    return (req, _res, next) => {
        const token = parseBearer(req.header('authorization'));
        if (!token)
            return next(createHttpError(401, 'missing_auth'));
        try {
            const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
            if (payload.typ !== 'access')
                return next(createHttpError(401, 'invalid_token'));
            req.user = { sub: payload.sub };
            return next();
        }
        catch {
            return next(createHttpError(401, 'invalid_token'));
        }
    };
}
