import mongoose, { Document, Schema } from 'mongoose';

export interface IWeightTier {
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface IEstimatedDays {
  min: number;
  max: number;
}

export interface IPricingRule extends Document {
  providerId: mongoose.Types.ObjectId;
  deliveryType: 'intra_lga' | 'inter_lga_same_state' | 'inter_state';
  fromState: string;
  fromLGA?: string;
  toState: string;
  toLGA?: string;
  weightTiers: IWeightTier[];
  insuranceFee: number;
  packagingFee: number;
  estimatedDays?: IEstimatedDays;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pricingRuleSchema = new Schema<IPricingRule>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'LogisticsProvider',
      required: true,
    },
    deliveryType: {
      type: String,
      enum: ['intra_lga', 'inter_lga_same_state', 'inter_state'],
      required: true,
    },
    fromState: {
      type: String,
      required: true,
    },
    fromLGA: {
      type: String,
    },
    toState: {
      type: String,
      required: true,
    },
    toLGA: {
      type: String,
    },
    weightTiers: [
      {
        minWeight: {
          type: Number,
          required: true,
        },
        maxWeight: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    insuranceFee: {
      type: Number,
      default: 0,
    },
    packagingFee: {
      type: Number,
      default: 0,
    },
    estimatedDays: {
      min: Number,
      max: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

pricingRuleSchema.index({
  providerId: 1,
  deliveryType: 1,
  fromState: 1,
  toState: 1,
  isActive: 1,
});

pricingRuleSchema.index({
  providerId: 1,
  fromLGA: 1,
  toLGA: 1,
});

export const PricingRule = mongoose.model<IPricingRule>(
  'PricingRule',
  pricingRuleSchema,
);
