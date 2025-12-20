import mongoose, { Schema, Types } from 'mongoose';

export type ProjectRole = 'owner' | 'maintainer' | 'contributor' | 'viewer';

export interface ProjectMember {
    orgId: Types.ObjectId;
    projectId: Types.ObjectId;
    userId: Types.ObjectId;
    role: ProjectRole;
    status: 'active' | 'invited' | 'disabled';
}

const projectMemberSchema = new Schema<ProjectMember>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        role: { type: String, required: true, enum: ['owner', 'maintainer', 'contributor', 'viewer'] },
        status: { type: String, required: true, enum: ['active', 'invited', 'disabled'], default: 'active' }
    },
    { timestamps: true }
);

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectMemberModel = mongoose.model<ProjectMember>('ProjectMember', projectMemberSchema);
