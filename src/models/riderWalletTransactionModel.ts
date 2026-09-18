import { Schema, model, Document, Types } from 'mongoose';

export type RiderWalletTransactionType = 'credit' | 'debit';
export type RiderWalletTransactionReason = 'booking_earning' | 'withdrawal' | 'adjustment';

export interface IRiderWalletTransaction extends Document {
  rider: Types.ObjectId;
  wallet: Types.ObjectId;
  type: RiderWalletTransactionType;
  reason: RiderWalletTransactionReason;
  amount: number;
  balanceAfter: number;
  booking?: Types.ObjectId;
  withdrawal?: Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RiderWalletTransactionSchema = new Schema<IRiderWalletTransaction>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
    wallet: { type: Schema.Types.ObjectId, ref: 'RiderWallet', required: true },
    type: { type: String, enum: ['credit', 'debit'] as RiderWalletTransactionType[], required: true },
    reason: {
      type: String,
      enum: ['booking_earning', 'withdrawal', 'adjustment'] as RiderWalletTransactionReason[],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    withdrawal: { type: Schema.Types.ObjectId, ref: 'RiderWithdrawal' },
    description: { type: String },
  },
  { timestamps: true },
);

RiderWalletTransactionSchema.index({ rider: 1, createdAt: -1 });

export const RiderWalletTransaction = model<IRiderWalletTransaction>(
  'RiderWalletTransaction',
  RiderWalletTransactionSchema,
);
