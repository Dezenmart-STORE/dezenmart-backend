import { Schema, model, Document, Types } from 'mongoose';

export type KorapayTransactionStatus = 'pending' | 'success' | 'failed' | 'abandoned';

export interface IKorapayTransaction extends Document {
  booking: Types.ObjectId;
  reference: string;
  providerReference?: string;
  amount: number;
  currency: string;
  status: KorapayTransactionStatus;
  customerEmail: string;
  checkoutUrl?: string;
  providerData?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KorapayTransactionSchema = new Schema<IKorapayTransaction>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    reference: { type: String, required: true, unique: true },
    providerReference: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'abandoned'] as KorapayTransactionStatus[],
      default: 'pending',
    },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    checkoutUrl: { type: String },
    providerData: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const KorapayTransaction = model<IKorapayTransaction>(
  'KorapayTransaction',
  KorapayTransactionSchema,
);
