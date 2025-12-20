import mongoose, { Schema } from 'mongoose';
const projectMemberSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, required: true, enum: ['owner', 'maintainer', 'contributor', 'viewer'] },
    status: { type: String, required: true, enum: ['active', 'invited', 'disabled'], default: 'active' }
}, { timestamps: true });
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
export const ProjectMemberModel = mongoose.model('ProjectMember', projectMemberSchema);
