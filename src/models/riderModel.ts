import { Schema, model, Document } from 'mongoose';

export type VehicleType = 'bike' | 'car' | 'van' | 'truck' | 'bicycle';
export type RiderVerificationStatus = 'pending' | 'verified' | 'rejected';
export type RiderAvailabilityStatus = 'offline' | 'online' | 'on_trip';

export interface IRider extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  vehicleType: VehicleType;
  vehiclePlateNumber: string;
  driverLicenseNumber?: string;
  profileImage?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  verificationStatus: RiderVerificationStatus;
  availabilityStatus: RiderAvailabilityStatus;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RiderSchema = new Schema<IRider>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'van', 'truck', 'bicycle'] as VehicleType[],
      required: true,
    },
    vehiclePlateNumber: { type: String, required: true, trim: true },
    driverLicenseNumber: { type: String, trim: true },
    profileImage: { type: String },
    bankName: { type: String },
    bankAccountNumber: { type: String },
    bankAccountName: { type: String },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'] as RiderVerificationStatus[],
      default: 'pending',
    },
    availabilityStatus: {
      type: String,
      enum: ['offline', 'online', 'on_trip'] as RiderAvailabilityStatus[],
      default: 'offline',
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalTrips: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

RiderSchema.index({ availabilityStatus: 1, verificationStatus: 1, isActive: 1 });

export const Rider = model<IRider>('Rider', RiderSchema);
