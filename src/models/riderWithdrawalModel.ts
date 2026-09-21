import { Schema, model, Document, Types } from 'mongoose';

export type RiderWithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface IRiderWithdrawal extends Document {
  rider: Types.ObjectId;
  amount: number;
  status: RiderWithdrawalStatus;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  adminNote?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RiderWithdrawalSchema = new Schema<IRiderWithdrawal>(
  {
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'] as RiderWithdrawalStatus[],
      default: 'pending',
    },
    bankName: { type: String, required: true },
    bankAccountNumber: { type: String, required: true },
    bankAccountName: { type: String, required: true },
    adminNote: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true },
);

RiderWithdrawalSchema.index({ rider: 1, createdAt: -1 });

export const RiderWithdrawal = model<IRiderWithdrawal>('RiderWithdrawal', RiderWithdrawalSchema);
