import mongoose, { Schema, Types } from 'mongoose';

export interface TaskComment {
    orgId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    taskId: Types.ObjectId;
    body: string;
    createdByUserId: Types.ObjectId;
}

const taskCommentSchema = new Schema<TaskComment>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        taskId: { type: Schema.Types.ObjectId, required: true, index: true },
        body: { type: String, required: true },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

taskCommentSchema.index({ taskId: 1, createdAt: -1 });

export const TaskCommentModel = mongoose.model<TaskComment>('TaskComment', taskCommentSchema);
