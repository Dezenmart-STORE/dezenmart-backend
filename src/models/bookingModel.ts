import { Schema, model, Document, Types } from 'mongoose';

export type BookingType = 'ride' | 'delivery';
export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type BookingPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
export type RideType = 'standard' | 'premium';
export type PackageSizeCategory = 'small' | 'medium' | 'large';
export type CancelledBy = 'customer' | 'rider' | 'admin' | 'system';

export interface IBookingLocation {
  label?: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface IBookingPackage {
  description: string;
  sizeCategory?: PackageSizeCategory;
  weightKg?: number;
  value?: number;
}

export interface IBooking extends Document {
  bookingRef: string;
  type: BookingType;
  status: BookingStatus;
  customerUser?: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupAddress: IBookingLocation;
  dropoffAddress: IBookingLocation;
  rideType?: RideType;
  passengerCount?: number;
  package?: IBookingPackage;
  recipientName?: string;
  recipientPhone?: string;
  distanceKm?: number;
  fareAmount: number;
  currency: string;
  paymentStatus: BookingPaymentStatus;
  paymentTransaction?: Types.ObjectId;
  assignedRider?: Types.ObjectId;
  rejectedBy: Types.ObjectId[];
  riderAssignedAt?: Date;
  riderAcceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: CancelledBy;
  cancellationReason?: string;
  platformFeeAmount?: number;
  riderEarningAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingLocationSchema = new Schema<IBookingLocation>(
  {
    label: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false },
);

const bookingPackageSchema = new Schema<IBookingPackage>(
  {
    description: { type: String, required: true, trim: true },
    sizeCategory: { type: String, enum: ['small', 'medium', 'large'] as PackageSizeCategory[] },
    weightKg: { type: Number, min: 0 },
    value: { type: Number, min: 0 },
  },
  { _id: false },
);

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: { type: String, required: true, unique: true },
    type: { type: String, enum: ['ride', 'delivery'] as BookingType[], required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as BookingStatus[],
      default: 'pending',
    },
    customerUser: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    pickupAddress: { type: bookingLocationSchema, required: true },
    dropoffAddress: { type: bookingLocationSchema, required: true },
    rideType: { type: String, enum: ['standard', 'premium'] as RideType[] },
    passengerCount: { type: Number, min: 1 },
    package: { type: bookingPackageSchema },
    recipientName: { type: String, trim: true },
    recipientPhone: { type: String, trim: true },
    distanceKm: { type: Number, min: 0 },
    fareAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'] as BookingPaymentStatus[],
      default: 'unpaid',
    },
    paymentTransaction: { type: Schema.Types.ObjectId, ref: 'KorapayTransaction' },
    assignedRider: { type: Schema.Types.ObjectId, ref: 'Rider' },
    rejectedBy: [{ type: Schema.Types.ObjectId, ref: 'Rider' }],
    riderAssignedAt: { type: Date },
    riderAcceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['customer', 'rider', 'admin', 'system'] as CancelledBy[] },
    cancellationReason: { type: String, trim: true },
    platformFeeAmount: { type: Number, min: 0 },
    riderEarningAmount: { type: Number, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

BookingSchema.index({ customerEmail: 1 });
BookingSchema.index({ customerPhone: 1 });
BookingSchema.index({ status: 1, paymentStatus: 1, createdAt: 1 });
BookingSchema.index({ assignedRider: 1 });

export const Booking = model<IBooking>('Booking', BookingSchema);
