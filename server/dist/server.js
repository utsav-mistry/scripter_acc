import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './lib/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { globalRateLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { orgRouter } from './routes/orgs.js';
import { projectRouter } from './routes/projects.js';
import { boardRouter } from './routes/boards.js';
import { taskRouter } from './routes/tasks.js';
import { auditRouter } from './routes/audit.js';
export function createServer() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', env.TRUST_PROXY);
    app.use(helmet());
    app.use(cors({
        origin: env.CORS_ORIGIN,
        credentials: true
    }));
    app.use(compression());
    app.use(requestIdMiddleware());
    app.use(requestLogger());
    app.use(globalRateLimiter());
    app.use(express.json({ limit: '2mb' }));
    app.use(cookieParser());
    app.get('/', (_req, res) => res.json({ name: 'pm-suite-api', version: '0.1.0' }));
    app.use('/health', healthRouter);
    app.use('/api/auth', authRouter);
    app.use('/api/orgs', orgRouter);
    app.use('/api/projects', projectRouter);
    app.use('/api', boardRouter);
    app.use('/api/tasks', taskRouter);
    app.use('/api/audit', auditRouter);
    app.use(notFoundHandler());
    app.use(errorHandler());
    return app;
}
