import { randomId } from '../lib/id.js';
export function requestIdMiddleware() {
    return (req, res, next) => {
        const header = req.header('x-request-id');
        const id = header && header.length <= 128 ? header : randomId(16);
        req.requestId = id;
        res.setHeader('x-request-id', id);
        next();
    };
}
