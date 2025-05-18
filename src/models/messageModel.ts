import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  content?: string;
  read: boolean;
  order?: Schema.Types.ObjectId;
  fileUrl?: string;
  fileType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, trim: true },
    read: { type: Boolean, default: false },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    fileUrl: { type: String },
    fileType: { type: String }
  },
  { timestamps: true },
);

MessageSchema.pre<IMessage>('save', function (next) {
  if (!this.content && !this.fileUrl) {
    next(new Error('Message must have either content or a file.'));
  } else {
    next();
  }
});

export const Message = model<IMessage>('Message', MessageSchema);
