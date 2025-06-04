import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  profileImage?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  address?: string;
  isMerchant: boolean;
  rating?: number;
  totalPoints: number;
  orders: Types.ObjectId[];
  availablePoints: number;
  milestones: {
    sales: number;
    purchases: number;
  };
  lastRewardCalculation: Date;
  referralCode: string;
  referredBy?: Schema.Types.ObjectId;
  referralCount: number;
  isReferralCodeUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    phoneNumber: { type: String },
    address: { type: String },
    isMerchant: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
    availablePoints: { type: Number, default: 0 },
    milestones: {
      sales: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },
    lastRewardCalculation: { type: Date },
    referralCode: {
      type: String,
      unique: true,
      default: () => Math.random().toString(36).substr(2, 8).toUpperCase(),
    },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', immutable: true },
    referralCount: { type: Number, default: 0 },
    isReferralCodeUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', UserSchema);
