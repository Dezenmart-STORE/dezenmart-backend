import { Schema, model, Document, Types } from 'mongoose';

export interface IRiderWallet extends Document {
  rider: Types.ObjectId;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const RiderWalletSchema = new Schema<IRiderWallet>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalWithdrawn: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'NGN' },
  },
  { timestamps: true },
);

export const RiderWallet = model<IRiderWallet>('RiderWallet', RiderWalletSchema);
