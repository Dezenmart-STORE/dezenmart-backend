import { Document, Schema, model } from 'mongoose';

export interface ITerms extends Document {
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const termsSchema = new Schema<ITerms>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    version: { type: String, required: true, trim: true, default: '1.0.0' },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

termsSchema.index({ isActive: 1, createdAt: -1 });

export const Terms = model<ITerms>('Terms', termsSchema);
