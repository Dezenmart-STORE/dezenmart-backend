import { Schema, model, Document, Types } from 'mongoose';

export type OtpSubjectType = 'rider' | 'booking';
export type OtpPurpose = 'rider_login' | 'booking_completion';

export interface IOtpCode extends Document {
  subjectType: OtpSubjectType;
  subjectId: Types.ObjectId;
  purpose: OtpPurpose;
  codeHash: string;
  destinationEmail: string;
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    subjectType: { type: String, enum: ['rider', 'booking'] as OtpSubjectType[], required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    purpose: {
      type: String,
      enum: ['rider_login', 'booking_completion'] as OtpPurpose[],
      required: true,
    },
    codeHash: { type: String, required: true },
    destinationEmail: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date },
  },
  { timestamps: true },
);

OtpCodeSchema.index({ subjectType: 1, subjectId: 1, purpose: 1, consumedAt: 1 });
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = model<IOtpCode>('OtpCode', OtpCodeSchema);
