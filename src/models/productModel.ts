import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  type: { [key: string]: string | number }[]
  category: string;
  seller: Schema.Types.ObjectId;
  sellerWalletAddress: string;
  stock: number;
  images: string[];
  logisticsProviders: string[];
  logisticsCost: string[];
  tradeId: string;
  isSponsored: boolean;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: [{ type: Schema.Types.Mixed }], required: true },
    category: { type: String, required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerWalletAddress: { type: String, required: true },
    stock: { type: Number, required: true },
    images: [{ type: String, required: true }],
    logisticsProviders: [{ type: String }],
    logisticsCost: [{ type: String }],
    tradeId: { type: String },
    isSponsored: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Product = model<IProduct>('Product', productSchema);
