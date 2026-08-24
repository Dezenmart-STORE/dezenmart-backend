import { Schema, model, Document } from 'mongoose';
import { fiatAccountSchema, IFiatAccount } from './schemas/fiatAccountSchema';

export type PaymentType = 'crypto' | 'fiat';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  type: { [key: string]: string | number }[];
  category: string;
  seller: Schema.Types.ObjectId;
  paymentType: PaymentType;
  sellerWalletAddress?: string;
  sellerBankAccount?: IFiatAccount;
  stock: number;
  weight: number;
  state: string;
  lga: string;
  images: string[];
  tradeId: string;
  isSponsored: boolean;
  rating: number;
  isActive: boolean;
  paymentToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Price must be an integer.',
      },
    },
    type: { type: [{ type: Schema.Types.Mixed }], required: true },
    category: { type: String, required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentType: {
      type: String,
      enum: ['crypto', 'fiat'],
      required: true,
      default: 'crypto',
    },
    sellerWalletAddress: {
      type: String,
      required: function (this: IProduct) {
        return this.paymentType !== 'fiat';
      },
    },
    sellerBankAccount: {
      type: fiatAccountSchema,
      required: function (this: IProduct) {
        return this.paymentType === 'fiat';
      },
    },
    stock: { type: Number, required: true },
    weight: { type: Number, required: true, min: 0 },
    state: { type: String, required: true, trim: true },
    lga: { type: String, required: true, trim: true },
    images: [{ type: String, required: true }],
    tradeId: { type: String },
    isSponsored: { type: Boolean, default: false },
    rating: { type: Number, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
    paymentToken: {
      type: String,
      required: function (this: IProduct) {
        return this.paymentType !== 'fiat';
      },
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

export const Product = model<IProduct>('Product', productSchema);
