import { Document, Schema, Types, model } from 'mongoose';

export type DeliveryType = 'intra_lga' | 'inter_lga_same_state' | 'inter_state';

export interface IWeightTier {
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface IPricingRule extends Document {
  providerId: Types.ObjectId;
  deliveryType: DeliveryType;
  fromState: string;
  fromLga?: string;
  toState: string;
  toLga?: string;
  weightTiers: IWeightTier[];
  insuranceFee: number;
  packagingFee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
}

const weightTierSchema = new Schema<IWeightTier>(
  {
    minWeight: { type: Number, required: true, min: 0 },
    maxWeight: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const pricingRuleSchema = new Schema<IPricingRule>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Logistics', required: true },
    deliveryType: {
      type: String,
      enum: ['intra_lga', 'inter_lga_same_state', 'inter_state'] as DeliveryType[],
      required: true,
    },
    fromState: { type: String, required: true },
    fromLga: { type: String },
    toState: { type: String, required: true },
    toLga: { type: String },
    weightTiers: { type: [weightTierSchema], required: true },
    insuranceFee: { type: Number, default: 0, min: 0 },
    packagingFee: { type: Number, default: 0, min: 0 },
    estimatedDaysMin: { type: Number, required: true, min: 1 },
    estimatedDaysMax: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

pricingRuleSchema.index(
  { providerId: 1, deliveryType: 1, fromState: 1, fromLga: 1, toState: 1, toLga: 1 },
  { unique: true, sparse: true },
);
pricingRuleSchema.index({ providerId: 1, isActive: 1 });

export const PricingRule = model<IPricingRule>('PricingRule', pricingRuleSchema);
