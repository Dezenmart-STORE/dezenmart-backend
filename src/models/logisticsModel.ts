import { Document, Schema, model } from 'mongoose';
import { CHAINENUMS } from '../services/chainsContracts/contractService';

export interface ILogistics extends Document {
  name: string;
  chain: string;
  walletAddress: string;
  isActive: boolean;
}

const logisticsSchema = new Schema<ILogistics>(
  {
    name: { type: String, required: true, unique: true },
    chain: { type: String, required: true, default:CHAINENUMS.ethereum },
    walletAddress: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Logistics = model<ILogistics>('Logistics', logisticsSchema);
