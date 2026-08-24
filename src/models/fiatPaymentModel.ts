import { Schema, model, Document, Types } from 'mongoose';

export type FiatPaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned';
export type FiatProvider = 'paystack' | 'flutterwave';

export interface IFiatPayment extends Document {
  order: Types.ObjectId;
  buyer: Types.ObjectId;
  provider: FiatProvider;
  reference: string;
  baseAmount: number;
  platformFeeAmount: number;
  amount: number;
  currency: string;
  status: FiatPaymentStatus;
  authorizationUrl?: string;
  gatewayData?: unknown;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FiatPaymentSchema = new Schema<IFiatPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, enum: ['paystack', 'flutterwave'], required: true },
    reference: { type: String, required: true, unique: true },
    baseAmount: { type: Number, required: true, min: 0 },
    platformFeeAmount: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'abandoned'],
      default: 'pending',
    },
    authorizationUrl: { type: String },
    gatewayData: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

export const FiatPayment = model<IFiatPayment>('FiatPayment', FiatPaymentSchema);
