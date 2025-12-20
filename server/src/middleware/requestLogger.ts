import type { RequestHandler } from 'express';

export function requestLogger(): RequestHandler {
    return (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const ms = Date.now() - start;
            const requestId = (req as any).requestId ?? '';
            const msg = `[http] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms${requestId ? ` rid=${requestId}` : ''}`;
            // eslint-disable-next-line no-console
            console.log(msg);
        });
        next();
    };
}
