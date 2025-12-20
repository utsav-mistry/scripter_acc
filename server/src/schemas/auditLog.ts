import mongoose, { Schema, Types } from 'mongoose';

export type AuditEntityType =
    | 'org'
    | 'workspace'
    | 'project'
    | 'project_member'
    | 'board'
    | 'task'
    | 'task_comment'
    | 'label'
    | 'attachment';

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'add_member'
    | 'remove_member'
    | 'status_change'
    | 'move'
    | 'upload'
    | 'download';

export interface AuditLog {
    actorUserId?: Types.ObjectId;
    orgId?: Types.ObjectId;
    workspaceId?: Types.ObjectId;
    projectId?: Types.ObjectId;
    entityType: AuditEntityType;
    entityId: Types.ObjectId;
    action: AuditAction;
    requestId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: unknown;
}

const auditLogSchema = new Schema<AuditLog>(
    {
        actorUserId: { type: Schema.Types.ObjectId, index: true },
        orgId: { type: Schema.Types.ObjectId, index: true },
        workspaceId: { type: Schema.Types.ObjectId, index: true },
        projectId: { type: Schema.Types.ObjectId, index: true },
        entityType: { type: String, required: true, index: true },
        entityId: { type: Schema.Types.ObjectId, required: true, index: true },
        action: { type: String, required: true, index: true },
        requestId: { type: String },
        ip: { type: String },
        userAgent: { type: String },
        metadata: { type: Schema.Types.Mixed }
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ projectId: 1, createdAt: -1 });

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', auditLogSchema);
