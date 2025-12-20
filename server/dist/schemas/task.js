import mongoose, { Schema } from 'mongoose';
const taskSchema = new Schema({
    orgId: { type: Schema.Types.ObjectId, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, required: true, index: true },
    boardId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        required: true,
        enum: ['todo', 'in_progress', 'blocked', 'done', 'canceled'],
        default: 'todo'
    },
    priority: { type: Number, required: true, enum: [1, 2, 3, 4], default: 3 },
    assigneeUserId: { type: Schema.Types.ObjectId, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    dueAt: { type: Date }
}, { timestamps: true });
export const TaskModel = mongoose.model('Task', taskSchema);
