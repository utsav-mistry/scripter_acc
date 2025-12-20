import mongoose, { Schema, Types } from 'mongoose';

export interface Workspace {
    orgId: Types.ObjectId;
    name: string;
    key: string;
    createdByUserId: Types.ObjectId;
}

const workspaceSchema = new Schema<Workspace>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true },
        key: { type: String, required: true },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

workspaceSchema.index({ orgId: 1, key: 1 }, { unique: true });

export const WorkspaceModel = mongoose.model<Workspace>('Workspace', workspaceSchema);
