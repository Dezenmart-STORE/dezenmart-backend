import { Document, Schema, model } from 'mongoose';

export const TERMS_TYPES = [
  'terms_of_use',
  'privacy_policy',
  'cookie_policy',
] as const;

export type TermsType = (typeof TERMS_TYPES)[number];

export interface ITerms extends Document {
  type: TermsType;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const termsSchema = new Schema<ITerms>(
  {
    type: { type: String, enum: TERMS_TYPES, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    version: { type: String, required: true, trim: true, default: '1.0.0' },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

termsSchema.index({ type: 1, isActive: 1, createdAt: -1 });

export const Terms = model<ITerms>('Terms', termsSchema);
