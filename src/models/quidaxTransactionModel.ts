import { Schema, model, Document, Types } from 'mongoose';

export type RampType = 'on_ramp' | 'off_ramp';
export type RampStatus = 'initiated' | 'confirmed' | 'completed' | 'failed';

export interface IQuidaxTransaction extends Document {
  userId: Types.ObjectId;
  type: RampType;
  status: RampStatus;
  merchantReference: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  quidaxData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const QuidaxTransactionSchema = new Schema<IQuidaxTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['on_ramp', 'off_ramp'], required: true },
    status: {
      type: String,
      enum: ['initiated', 'confirmed', 'completed', 'failed'],
      default: 'initiated',
    },
    merchantReference: { type: String, required: true },
    fromCurrency: { type: String, required: true },
    toCurrency: { type: String, required: true },
    fromAmount: { type: String, required: true },
    quidaxData: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

QuidaxTransactionSchema.index({ userId: 1 });
QuidaxTransactionSchema.index({ merchantReference: 1 });

export const QuidaxTransaction = model<IQuidaxTransaction>(
  'QuidaxTransaction',
  QuidaxTransactionSchema,
);
