import type { RequestHandler } from 'express';

export function notFoundHandler(): RequestHandler {
    return (req, res) => {
        res.status(404).json({ error: 'not_found', path: req.path });
    };
}
