import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import { ProjectMemberModel } from '../schemas/projectMember.js';
import { projectRoleAtLeast } from '../lib/projectRbac.js';
export function requireProjectRole(minRole) {
    return async (req, _res, next) => {
        const projectId = req.params.projectId;
        if (!projectId)
            return next(createHttpError(400, 'missing_projectId'));
        if (!req.user?.sub)
            return next(createHttpError(401, 'missing_auth'));
        const member = await ProjectMemberModel.findOne({
            projectId: new mongoose.Types.ObjectId(projectId),
            userId: new mongoose.Types.ObjectId(req.user.sub),
            status: 'active'
        });
        if (!member)
            return next(createHttpError(403, 'forbidden'));
        if (!projectRoleAtLeast(member.role, minRole))
            return next(createHttpError(403, 'forbidden'));
        req.projectAccess = { projectId, role: member.role };
        next();
    };
}
