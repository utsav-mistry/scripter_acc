import mongoose, { Schema } from 'mongoose';
const workspaceSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
}, { timestamps: true });
workspaceSchema.index({ orgId: 1, key: 1 }, { unique: true });
export const WorkspaceModel = mongoose.model('Workspace', workspaceSchema);
