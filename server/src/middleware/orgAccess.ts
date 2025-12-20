import type { RequestHandler } from 'express';
import createHttpError from '../lib/httpError.js';
import mongoose from 'mongoose';

import { OrgMemberModel } from '../schemas/orgMember.js';
import type { OrgRole } from '../schemas/orgMember.js';

const roleWeight: Record<OrgRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
};

function orgRoleAtLeast(actual: OrgRole, required: OrgRole) {
    return roleWeight[actual] >= roleWeight[required];
}

declare module 'express-serve-static-core' {
    interface Request {
        orgAccess?: { orgId: string; role: OrgRole };
    }
}

export function requireOrgRole(minRole: OrgRole): RequestHandler {
    return async (req, _res, next) => {
        const orgId = req.params.orgId;
        if (!orgId) return next(createHttpError(400, 'missing_orgId'));
        if (!req.user?.sub) return next(createHttpError(401, 'missing_auth'));

        const member = await OrgMemberModel.findOne({
            orgId: new mongoose.Types.ObjectId(orgId),
            userId: new mongoose.Types.ObjectId(req.user.sub),
            status: 'active'
        });

        if (!member) return next(createHttpError(403, 'forbidden'));
        if (!orgRoleAtLeast(member.role, minRole)) return next(createHttpError(403, 'forbidden'));

        req.orgAccess = { orgId, role: member.role };
        next();
    };
}
