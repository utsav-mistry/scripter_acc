import { z } from 'zod';

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    MONGO_URI: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(20),
    JWT_REFRESH_SECRET: z.string().min(20),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
    TRUST_PROXY: z.coerce.boolean().default(false),
    MORGAN_FORMAT: z.string().default('tiny'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(240)
});

export const env = schema.parse(process.env);
