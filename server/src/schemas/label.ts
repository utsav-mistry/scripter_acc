import mongoose, { Schema, Types } from 'mongoose';

export interface Label {
    orgId: Types.ObjectId;
    projectId: Types.ObjectId;
    name: string;
    color: string;
    createdByUserId: Types.ObjectId;
}

const labelSchema = new Schema<Label>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        projectId: { type: Schema.Types.ObjectId, required: true, index: true },
        name: { type: String, required: true },
        color: { type: String, required: true },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

labelSchema.index({ projectId: 1, name: 1 }, { unique: true });

export const LabelModel = mongoose.model<Label>('Label', labelSchema);
