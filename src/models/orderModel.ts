import { Schema, model, Document, Types } from 'mongoose';

interface IOrder extends Document {
  product: Schema.Types.ObjectId;
  buyer: Schema.Types.ObjectId;
  seller: Schema.Types.ObjectId;
  amount: number;
  quantity: number;
  sellerWalletAddress: string;
  logisticsProviderWalletAddress: string[];
  status:
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'completed'
    | 'disputed'
    | 'refunded'
    | 'delivery_confirmed';
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
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    quantity: { type: Number, required: true },
    sellerWalletAddress: { type: String },
    logisticsProviderWalletAddress: [{ type: String }],
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
      ],
      default: 'pending',
    },
    dispute: {
      raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      resolved: Boolean,
    },
  },
  { timestamps: true },
);

export const Order = model<IOrder>('Order', OrderSchema);
