import mongoose, { Schema } from 'mongoose';
const boardSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['kanban', 'scrum', 'backlog'], default: 'kanban' },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
}, { timestamps: true });
export const BoardModel = mongoose.model('Board', boardSchema);
