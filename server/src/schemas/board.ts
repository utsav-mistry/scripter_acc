import mongoose, { Schema, Types } from 'mongoose';

export interface Board {
    orgId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    projectId: Types.ObjectId;
    name: string;
    type: 'kanban' | 'scrum' | 'backlog';
    createdByUserId: Types.ObjectId;
}

const boardSchema = new Schema<Board>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        workspaceId: { type: Schema.Types.ObjectId, required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true },
        type: { type: String, required: true, enum: ['kanban', 'scrum', 'backlog'], default: 'kanban' },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

export const BoardModel = mongoose.model<Board>('Board', boardSchema);
