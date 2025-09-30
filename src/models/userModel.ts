import { Schema, model, Document, Types } from 'mongoose';

export enum Role {
  USER = 'user',
  BUYER = 'buyer',
  SELLER = 'seller',
  LOGISTICS_AGENT = 'logistic agent',
  ADMIN = 'admin',
}
export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  profileImage?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  roles?: Role[];
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
  selfId?: string; // Unique identifier from Self Protocol proof
  selfVerification?: {
    nullifier: string; // From publicSignals, unique per verification
    verificationLevel: string; // e.g., 'basic', 'advanced', 'kyc'
    isVerified: boolean; // Overall verification status
    credentialSubject?: any; // Full credential subject from the proof
  };
  hasAcceptedTerms: boolean;
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
    roles: {
      type: [String],
      enum: Object.values(Role),
      default: [Role.USER],
    },
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
    selfId: { type: String, unique: true, sparse: true },
    selfVerification: {
      nullifier: { type: String, unique: true, sparse: true },
      verificationLevel: { type: String },
      isVerified: { type: Boolean, default: false },
      credentialSubject: { type: Schema.Types.Mixed },
    },
    hasAcceptedTerms: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index for efficient Self Protocol queries
UserSchema.index({ 'selfVerification.isVerified': 1 });
UserSchema.index({ 'selfVerification.verificationLevel': 1 });

export const User = model<IUser>('User', UserSchema);
