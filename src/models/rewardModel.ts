import { Schema, model, Document } from 'mongoose';

export enum RewardActionType {
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  FIVE_STAR_REVIEW = 'FIVE_STAR_REVIEW',
  SALES_MILESTONE = 'SALES_MILESTONE',
  FIRST_PURCHASE = 'FIRST_PURCHASE',
  PURCHASE_MILESTONE = 'PURCHASE_MILESTONE',
  TESTNET_BONUS_SELLER = 'TESTNET_BONUS_SELLER',
  TESTNET_BONUS_BUYER = 'TESTNET_BONUS_BUYER',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
}

export interface IReward extends Document {
  userId: Schema.Types.ObjectId;
  actionType: RewardActionType;
  points: number;
  referenceId?: Schema.Types.ObjectId; // Order/Product/Review ID
  metadata?: any;
  createdAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: {
      type: String,
      enum: Object.values(RewardActionType),
      required: true,
    },
    points: { type: Number, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Index for faster queries on user rewards
RewardSchema.index({ userId: 1, createdAt: -1 });

export const Reward = model<IReward>('Reward', RewardSchema);
