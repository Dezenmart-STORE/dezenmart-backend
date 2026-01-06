import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress {
  street: string;
  lga: string;
  state: string;
  country: string;
}

export interface IDimensions {
  length: number;
  width: number;
  height: number;
}

export interface IPackageDetails {
  weight: number;
  dimensions?: IDimensions;
  description?: string;
  value?: number;
}

export interface IPricing {
  basePrice: number;
  insuranceFee: number;
  packagingFee: number;
  totalPrice: number;
  currency: string;
}

export type DeliveryStatus =
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface IDelivery extends Document {
  orderId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  deliveryType: 'intra_lga' | 'inter_lga_same_state' | 'inter_state';
  packageDetails: IPackageDetails;
  pricing: IPricing;
  status: DeliveryStatus;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  paymentStatus: PaymentStatus;
  transactionHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'LogisticsProvider',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pickupAddress: {
      street: String,
      lga: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: { type: String, default: 'Nigeria' },
    },
    deliveryAddress: {
      street: String,
      lga: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: { type: String, default: 'Nigeria' },
    },
    deliveryType: {
      type: String,
      enum: ['intra_lga', 'inter_lga_same_state', 'inter_state'],
      required: true,
    },
    packageDetails: {
      weight: {
        type: Number,
        required: true,
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      description: String,
      value: Number,
    },
    pricing: {
      basePrice: Number,
      insuranceFee: Number,
      packagingFee: Number,
      totalPrice: Number,
      currency: { type: String, default: 'NGN' },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled',
        'failed',
      ],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    transactionHash: String,
  },
  { timestamps: true },
);

deliverySchema.index({ trackingNumber: 1 });
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ customerId: 1 });
deliverySchema.index({ status: 1, createdAt: -1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', deliverySchema);
