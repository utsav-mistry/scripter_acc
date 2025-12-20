import mongoose, { Schema, Types } from 'mongoose';

export type NotificationType =
  | 'task_created'
  | 'task_updated'
  | 'task_commented'
  | 'task_assigned'
  | 'project_invite'
  | 'org_invite';

export interface Notification {
  userId: Types.ObjectId;
  orgId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  payload?: unknown;
  readAt?: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, index: true },
    projectId: { type: Schema.Types.ObjectId, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String },
    payload: { type: Schema.Types.Mixed },
    readAt: { type: Date, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<Notification>('Notification', notificationSchema);
