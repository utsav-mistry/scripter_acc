import { HttpError } from '../lib/httpError.js';
export function errorHandler() {
    return (err, req, res, _next) => {
        const status = err instanceof HttpError ? err.status : typeof err?.status === 'number' ? err.status : 500;
        const code = err instanceof HttpError ? err.code : err?.code ?? 'internal_error';
        res.status(status).json({
            error: code,
            message: status >= 500 ? 'Internal Server Error' : err?.message,
            requestId: req.requestId
        });
    };
}
