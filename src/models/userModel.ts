import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  isMerchant: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    isMerchant: { type: Boolean, default: false },
    rating: { type: Number },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>('User', userSchema);
