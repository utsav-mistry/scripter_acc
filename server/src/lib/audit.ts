import type { Request } from 'express';
import mongoose from 'mongoose';

import { AuditLogModel, type AuditAction, type AuditEntityType } from '../schemas/auditLog.js';

export function writeAudit(
    req: Request,
    input: {
        entityType: AuditEntityType;
        entityId: string;
        action: AuditAction;
        orgId?: string;
        workspaceId?: string;
        projectId?: string;
        metadata?: unknown;
    }
) {
    const actorUserId = (req as any).user?.sub ? new mongoose.Types.ObjectId((req as any).user.sub) : undefined;

    const doc = {
        actorUserId,
        orgId: input.orgId ? new mongoose.Types.ObjectId(input.orgId) : undefined,
        workspaceId: input.workspaceId ? new mongoose.Types.ObjectId(input.workspaceId) : undefined,
        projectId: input.projectId ? new mongoose.Types.ObjectId(input.projectId) : undefined,
        entityType: input.entityType,
        entityId: new mongoose.Types.ObjectId(input.entityId),
        action: input.action,
        requestId: (req as any).requestId,
        ip: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
        metadata: input.metadata
    };

    void AuditLogModel.create(doc).catch(() => {
        // best-effort: never break the request
    });
}
