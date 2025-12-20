import mongoose, { Schema, Types } from 'mongoose';

export type ProjectVisibility = 'private' | 'org';

export interface Project {
    orgId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    name: string;
    key: string;
    description?: string;
    visibility: ProjectVisibility;
    createdByUserId: Types.ObjectId;
}

const projectSchema = new Schema<Project>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true },
        key: { type: String, required: true },
        description: { type: String },
        visibility: { type: String, required: true, enum: ['private', 'org'], default: 'org' },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

export const ProjectModel = mongoose.model<Project>('Project', projectSchema);
