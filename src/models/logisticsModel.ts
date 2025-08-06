import { Document, Schema, model } from 'mongoose';

export interface ILogistics extends Document {
  name: string;
  walletAddress: string;
  isActive: boolean;
}

const logisticsSchema = new Schema<ILogistics>(
  {
    name: { type: String, required: true, unique: true },
    walletAddress: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Logistics = model<ILogistics>('Logistics', logisticsSchema);
