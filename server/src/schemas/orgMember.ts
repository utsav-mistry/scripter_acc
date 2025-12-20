import mongoose, { Schema, Types } from 'mongoose';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrgMember {
    orgId: Types.ObjectId;
    userId: Types.ObjectId;
    role: OrgRole;
    status: 'active' | 'invited' | 'disabled';
}

const orgMemberSchema = new Schema<OrgMember>(
    {
        orgId: { type: Schema.Types.ObjectId, required: true, index: true },
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        role: { type: String, required: true, enum: ['owner', 'admin', 'member', 'viewer'] },
        status: { type: String, required: true, enum: ['active', 'invited', 'disabled'], default: 'active' }
    },
    { timestamps: true }
);

orgMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export const OrgMemberModel = mongoose.model<OrgMember>('OrgMember', orgMemberSchema);
