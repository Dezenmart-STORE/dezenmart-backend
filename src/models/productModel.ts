import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  seller: Schema.Types.ObjectId;
  images: string[];
  isSponsored: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    images: [{ type: String, required: true }],
    isSponsored: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Product = model<IProduct>('Product', productSchema);
