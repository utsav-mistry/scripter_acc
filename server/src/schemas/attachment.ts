import mongoose, { Schema, Types } from 'mongoose';

export interface Attachment {
    orgId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    taskId: Types.ObjectId;
    filename: string;
    contentType: string;
    sizeBytes: number;
    storagePath: string;
    sha256: string;
    createdByUserId: Types.ObjectId;
}

const attachmentSchema = new Schema<Attachment>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        taskId: { type: Schema.Types.ObjectId, required: true, index: true },
        filename: { type: String, required: true },
        contentType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        storagePath: { type: String, required: true },
        sha256: { type: String, required: true },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

attachmentSchema.index({ taskId: 1, createdAt: -1 });

export const AttachmentModel = mongoose.model<Attachment>('Attachment', attachmentSchema);
