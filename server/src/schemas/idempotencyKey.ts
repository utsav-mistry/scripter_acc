import mongoose, { Schema, Types } from 'mongoose';

export type IdempotencyState = 'in_progress' | 'completed';

export interface IdempotencyKey {
    userId: Types.ObjectId;
    key: string;
    method: string;
    path: string;
    requestHash: string;
    state: IdempotencyState;
    responseStatus?: number;
    responseBody?: unknown;
    expiresAt: Date;
}

const idempotencyKeySchema = new Schema<IdempotencyKey>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, index: true },
        key: { type: String, required: true },
        method: { type: String, required: true },
        path: { type: String, required: true },
        requestHash: { type: String, required: true },
        state: { type: String, required: true, enum: ['in_progress', 'completed'], default: 'in_progress' },
        responseStatus: { type: Number },
        responseBody: { type: Schema.Types.Mixed },
        expiresAt: { type: Date, required: true, index: true }
    },
    { timestamps: true }
);

idempotencyKeySchema.index({ userId: 1, key: 1, method: 1, path: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyKeyModel = mongoose.model<IdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
