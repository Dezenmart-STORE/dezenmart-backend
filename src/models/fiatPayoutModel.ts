import { Schema, model, Document, Types } from 'mongoose';

export type FiatPayoutLegType = 'seller' | 'logistics';
export type FiatPayoutRecipientType = 'user' | 'logistics';
export type FiatPayoutStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'blocked';

export interface IFiatPayout extends Document {
  order: Types.ObjectId;
  legType: FiatPayoutLegType;
  recipientType: FiatPayoutRecipientType;
  recipientId: Types.ObjectId;
  provider: 'paystack' | 'flutterwave';
  recipientCode?: string;
  transferReference: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: FiatPayoutStatus;
  failureReason?: string;
  gatewayData?: unknown;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FiatPayoutSchema = new Schema<IFiatPayout>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    legType: { type: String, enum: ['seller', 'logistics'], required: true },
    recipientType: { type: String, enum: ['user', 'logistics'], required: true },
    recipientId: { type: Schema.Types.ObjectId, required: true },
    provider: { type: String, enum: ['paystack', 'flutterwave'], required: true },
    recipientCode: { type: String },
    transferReference: { type: String, required: true, unique: true },
    grossAmount: { type: Number, required: true, min: 0 },
    feeAmount: { type: Number, required: true, min: 0, default: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'blocked'],
      default: 'pending',
    },
    failureReason: { type: String },
    gatewayData: { type: Schema.Types.Mixed },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

FiatPayoutSchema.index({ order: 1, legType: 1 }, { unique: true });

export const FiatPayout = model<IFiatPayout>('FiatPayout', FiatPayoutSchema);
