import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    status: { type: String, required: true, enum: ['active', 'disabled'], default: 'active' }
}, { timestamps: true });
export const UserModel = mongoose.model('User', userSchema);
