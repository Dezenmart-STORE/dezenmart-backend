import { Document, Schema, Types, model } from 'mongoose';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface IDelivery extends Document {
  deliveryId: string;
  order: Types.ObjectId;
  buyer: Types.ObjectId;
  logisticsProvider?: Types.ObjectId;
  deliveryAddress: Types.ObjectId;
  status: DeliveryStatus;
  trackingNumber?: string;
  notes?: string;
  weight?: number;
  deliveryFee?: number;
  estimatedDeliveryDate?: Date;
  deliveredAt?: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    deliveryId: { type: String, unique: true, required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    logisticsProvider: { type: Schema.Types.ObjectId, ref: 'Logistics', index: true },
    deliveryAddress: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryAddress',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled',
        'failed',
      ] as DeliveryStatus[],
      default: 'pending',
    },
    trackingNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    weight: { type: Number, min: 0 },
    deliveryFee: { type: Number, min: 0 },
    estimatedDeliveryDate: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

deliverySchema.index({ status: 1, createdAt: -1 });

export const Delivery = model<IDelivery>('Delivery', deliverySchema);
