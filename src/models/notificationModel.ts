import { Schema, model, Document } from 'mongoose';

interface INotification extends Document {
  recipient: Schema.Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Notification = model<INotification>(
  'Notification',
  NotificationSchema,
);
