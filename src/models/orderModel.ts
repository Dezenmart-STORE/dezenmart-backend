import { Schema, model, Document, Types } from 'mongoose';

export type LogisticsStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'shipped'
  | 'delivered';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'delivery_confirmed'
  | 'delivered'
  | 'shipped';

interface IOrder extends Document {
  orderId: string;
  product: Schema.Types.ObjectId;
  buyer: Schema.Types.ObjectId;
  seller: Schema.Types.ObjectId;
  amount: number;
  quantity: number;
  stock: number;
  sellerWalletAddress: string;
  logisticsProvider?: Types.ObjectId;
  logisticsProviderWalletAddress: string;
  deliveryAddress?: Types.ObjectId;
  deliveryFee?: number;
  logisticsStatus: LogisticsStatus;
  purchaseId?: string;
  status: OrderStatus;
  shippedAt?: Date;
  expectedDeliveryDate?: Date;
  logisticsAcceptedAt?: Date;
  logisticsRejectedAt?: Date;
  declineReason?: string;
  trackingNumber?: string;
  shippingNotes?: string;
  dispute?: {
    raisedBy: Types.ObjectId;
    reason: string;
    resolved?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer.',
      },
    },
    quantity: {
      type: Number,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer.',
      },
    },
    stock: { type: Number },
    sellerWalletAddress: { type: String },
    logisticsProvider: {
      type: Schema.Types.ObjectId,
      ref: 'Logistics',
      index: true,
    },
    logisticsProviderWalletAddress: { type: String },
    deliveryAddress: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryAddress',
    },
    deliveryFee: { type: Number, min: 0 },
    logisticsStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'shipped', 'delivered'],
      default: 'pending',
    },
    purchaseId: { type: String },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'rejected',
        'completed',
        'disputed',
        'refunded',
        'delivery_confirmed',
        'delivered',
        'shipped',
      ],
      default: 'pending',
    },
    shippedAt: { type: Date },
    expectedDeliveryDate: { type: Date },
    logisticsAcceptedAt: { type: Date },
    logisticsRejectedAt: { type: Date },
    declineReason: { type: String },
    trackingNumber: { type: String },
    shippingNotes: { type: String },
    dispute: {
      raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      resolved: Boolean,
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

OrderSchema.index({ logisticsProvider: 1, logisticsStatus: 1 });

export const Order = model<IOrder>('Order', OrderSchema);
