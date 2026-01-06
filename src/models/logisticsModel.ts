import mongoose, { Document, Schema } from 'mongoose';

export interface ICoverageArea {
  state: string;
  lgas: string[];
  isStatewide: boolean;
}

export interface ILogisticsProvider extends Document {
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  isActive: boolean;
  coverageAreas: ICoverageArea[];
  rating: number;
  totalDeliveries: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const logisticsProviderSchema = new Schema<ILogisticsProvider>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    coverageAreas: [
      {
        state: {
          type: String,
          required: true,
        },
        lgas: [
          {
            type: String,
          },
        ],
        isStatewide: {
          type: Boolean,
          default: false,
        },
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

export default mongoose.model<ILogisticsProvider>(
  'LogisticsProvider',
  logisticsProviderSchema,
);
