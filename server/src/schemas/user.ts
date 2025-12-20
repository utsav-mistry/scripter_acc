import mongoose, { Schema } from 'mongoose';

export type UserStatus = 'active' | 'disabled';

export interface User {
    email: string;
    name: string;
    passwordHash: string;
    status: UserStatus;
}

const userSchema = new Schema<User>(
    {
        email: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true },
        passwordHash: { type: String, required: true },
        status: { type: String, required: true, enum: ['active', 'disabled'], default: 'active' }
    },
    { timestamps: true }
);

export const UserModel = mongoose.model<User>('User', userSchema);
