import { Document, Schema, Types, model } from 'mongoose';

export interface IDeliveryAddress extends Document {
  user: Types.ObjectId;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  lga: string;
  street: string;
  zipCode?: string;
  isDefault: boolean;
}

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    label: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'Nigeria', trim: true },
    state: { type: String, required: true, trim: true },
    lga: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

deliveryAddressSchema.index({ user: 1, isDefault: 1 });

export const DeliveryAddress = model<IDeliveryAddress>(
  'DeliveryAddress',
  deliveryAddressSchema,
);
