import { Schema, model, Document } from 'mongoose';

export interface IExchangeRate extends Document {
  usdAmount: number;
  tokenAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    usdAmount: { type: Number, required: true, default: 0 },
    tokenAmount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const ExchangeRate = model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
