import { Router } from 'express';
import createHttpError from '../lib/httpError.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../lib/env.js';
import { UserModel } from '../schemas/user.js';

export const authRouter = Router();

function signAccessToken(sub: string) {
    return jwt.sign({ sub, typ: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(sub: string) {
    return jwt.sign({ sub, typ: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

authRouter.post('/register', async (req, res) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password || !name) throw createHttpError(400, 'missing_fields');

    const existing = await UserModel.findOne({ email });
    if (existing) throw createHttpError(409, 'email_in_use');

    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await UserModel.create({ email, name, passwordHash, status: 'active' });

    const access = signAccessToken(String(user._id));
    const refresh = signRefreshToken(String(user._id));

    res
        .cookie('refresh_token', refresh, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env.NODE_ENV === 'production',
            path: '/api/auth'
        })
        .json({ accessToken: access, user: { id: user._id, email: user.email, name: user.name } });
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw createHttpError(400, 'missing_fields');

    const user = await UserModel.findOne({ email });
    if (!user) throw createHttpError(401, 'invalid_credentials');
    if (user.status !== 'active') throw createHttpError(403, 'user_inactive');

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw createHttpError(401, 'invalid_credentials');

    const access = signAccessToken(String(user._id));
    const refresh = signRefreshToken(String(user._id));

    res
        .cookie('refresh_token', refresh, {
            httpOnly: true,
            sameSite: 'lax',
            secure: env.NODE_ENV === 'production',
            path: '/api/auth'
        })
        .json({ accessToken: access, user: { id: user._id, email: user.email, name: user.name } });
});

authRouter.post('/logout', async (_req, res) => {
    res.clearCookie('refresh_token', { path: '/api/auth' }).json({ ok: true });
});
