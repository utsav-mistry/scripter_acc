import mongoose, { Schema } from 'mongoose';
const orgSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    plan: { type: String, required: true, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    createdByUserId: { type: Schema.Types.ObjectId, required: true, index: true }
}, { timestamps: true });
export const OrgModel = mongoose.model('Org', orgSchema);
