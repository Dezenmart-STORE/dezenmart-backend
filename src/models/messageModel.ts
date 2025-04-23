import { Schema, model, Document } from 'mongoose';

interface IMessage extends Document {
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  content: string;
  read: boolean;
  order?: Schema.Types.ObjectId;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true },
);

export const Message = model<IMessage>('Message', MessageSchema);
