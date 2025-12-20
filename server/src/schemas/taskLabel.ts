import mongoose, { Schema, Types } from 'mongoose';

export interface TaskLabel {
    projectId: Types.ObjectId;
    taskId: Types.ObjectId;
    labelId: Types.ObjectId;
    createdByUserId: Types.ObjectId;
}

const taskLabelSchema = new Schema<TaskLabel>(
    {
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        taskId: { type: Schema.Types.ObjectId, required: true, index: true },
        labelId: { type: Schema.Types.ObjectId, required: true, index: true },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

taskLabelSchema.index({ taskId: 1, labelId: 1 }, { unique: true });

export const TaskLabelModel = mongoose.model<TaskLabel>('TaskLabel', taskLabelSchema);
