import { Document, Schema, Types, model } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ICoverageArea {
  state: string;
  lgas: string[];
  isStatewide: boolean;
}

export interface ILogistics extends Document {
  userId: Types.ObjectId;
  name: string;
  companyName?: string;
  location?: string;
  email: string;
  phone: string;
  walletAddress: string;
  coverageAreas: ICoverageArea[];
  rating: number;
  totalDeliveries: number;
  verificationStatus: VerificationStatus;
  isActive: boolean;
}

const coverageAreaSchema = new Schema<ICoverageArea>(
  {
    state: { type: String, required: true },
    lgas: { type: [String], default: [] },
    isStatewide: { type: Boolean, default: false },
  },
  { _id: false },
);

const logisticsSchema = new Schema<ILogistics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, unique: true },
    companyName: { type: String, trim: true },
    location: { type: String, trim: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true },
    coverageAreas: { type: [coverageAreaSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'] as VerificationStatus[],
      default: 'pending',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

logisticsSchema.index({ verificationStatus: 1, isActive: 1 });
logisticsSchema.index({ 'coverageAreas.state': 1 });

export const Logistics = model<ILogistics>('Logistics', logisticsSchema);
