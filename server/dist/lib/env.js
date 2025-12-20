import createHttpError from './httpError.js';
function required(name) {
    const v = process.env[name];
    if (!v)
        throw createHttpError(500, 'missing_env', `Missing env var ${name}`);
    return v;
}
function optional(name, def) {
    const v = process.env[name];
    return v && v.length ? v : def;
}
function parseIntEnv(name, def, min, max) {
    const raw = process.env[name];
    const n = raw ? Number(raw) : def;
    if (!Number.isFinite(n) || !Number.isInteger(n))
        throw createHttpError(500, 'invalid_env', `Invalid env var ${name}`);
    if (min !== undefined && n < min)
        throw createHttpError(500, 'invalid_env', `Invalid env var ${name}`);
    if (max !== undefined && n > max)
        throw createHttpError(500, 'invalid_env', `Invalid env var ${name}`);
    return n;
}
function parseBoolEnv(name, def) {
    const raw = process.env[name];
    if (raw === undefined)
        return def;
    const v = raw.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes')
        return true;
    if (v === 'false' || v === '0' || v === 'no')
        return false;
    throw createHttpError(500, 'invalid_env', `Invalid env var ${name}`);
}
function requireMinLen(name, minLen) {
    const v = required(name);
    if (v.length < minLen)
        throw createHttpError(500, 'invalid_env', `Invalid env var ${name}`);
    return v;
}
const nodeEnvRaw = optional('NODE_ENV', 'development');
const NODE_ENV = ['development', 'test', 'production'].includes(nodeEnvRaw)
    ? nodeEnvRaw
    : 'development';
const MORGAN_FORMAT = optional('MORGAN_FORMAT', 'tiny');
export const env = {
    NODE_ENV,
    PORT: parseIntEnv('PORT', 8080, 1, 65535),
    MONGO_URI: required('MONGO_URI'),
    JWT_ACCESS_SECRET: requireMinLen('JWT_ACCESS_SECRET', 20),
    JWT_REFRESH_SECRET: requireMinLen('JWT_REFRESH_SECRET', 20),
    CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),
    TRUST_PROXY: parseBoolEnv('TRUST_PROXY', false),
    MORGAN_FORMAT,
    RATE_LIMIT_WINDOW_MS: parseIntEnv('RATE_LIMIT_WINDOW_MS', 60_000, 1000),
    RATE_LIMIT_MAX: parseIntEnv('RATE_LIMIT_MAX', 240, 1)
};
