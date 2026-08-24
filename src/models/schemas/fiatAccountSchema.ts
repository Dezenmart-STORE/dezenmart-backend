import { Schema } from 'mongoose';

export interface IFiatAccount {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  provider?: 'paystack' | 'flutterwave';
  verified: boolean;
}

export const fiatAccountSchema = new Schema<IFiatAccount>(
  {
    bankName: { type: String, required: true },
    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    provider: { type: String, enum: ['paystack', 'flutterwave'] },
    verified: { type: Boolean, default: false },
  },
  { _id: false },
);
