import type { RequestHandler } from 'express';

export function requestTimeout(ms: number): RequestHandler {
  return (_req, res, next) => {
    res.setTimeout(ms);
    next();
  };
}
