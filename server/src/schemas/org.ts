import mongoose, { Schema, Types } from 'mongoose';

export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Org {
    name: string;
    slug: string;
    plan: OrgPlan;
    createdByUserId: Types.ObjectId;
}

const orgSchema = new Schema<Org>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        plan: { type: String, required: true, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
    },
    { timestamps: true }
);

export const OrgModel = mongoose.model<Org>('Org', orgSchema);
