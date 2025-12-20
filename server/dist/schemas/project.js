import mongoose, { Schema } from 'mongoose';
const projectSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    description: { type: String },
    visibility: { type: String, required: true, enum: ['private', 'org'], default: 'org' },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
}, { timestamps: true });
projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
export const ProjectModel = mongoose.model('Project', projectSchema);
