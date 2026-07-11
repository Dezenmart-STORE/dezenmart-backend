import { Document, Schema, Types, model } from 'mongoose';

export interface ILogisticsQuote extends Document {
  buyer: Types.ObjectId;
  deliveryAddress: Types.ObjectId;
  logisticsProvider: Types.ObjectId;
  breakdown: {
    basePrice: number;
    insuranceFee: number;
    packagingFee: number;
    totalPrice: number;
  };
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  expiresAt: Date;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const logisticsQuoteSchema = new Schema<ILogisticsQuote>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deliveryAddress: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryAddress',
      required: true,
      index: true,
    },
    logisticsProvider: {
      type: Schema.Types.ObjectId,
      ref: 'Logistics',
      required: true,
      index: true,
    },
    breakdown: {
      basePrice: { type: Number, required: true, min: 0 },
      insuranceFee: { type: Number, required: true, min: 0 },
      packagingFee: { type: Number, required: true, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 },
    },
    estimatedDaysMin: { type: Number, required: true, min: 1 },
    estimatedDaysMax: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'used', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

export const LogisticsQuote = model<ILogisticsQuote>('LogisticsQuote', logisticsQuoteSchema);
