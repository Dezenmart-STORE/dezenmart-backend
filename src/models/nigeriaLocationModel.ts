import mongoose, { Document, Schema } from 'mongoose';

export interface INigeriaLocation extends Document {
  state: string;
  lgas: string[];
  createdAt: Date;
  updatedAt: Date;
}

const nigeriaLocationSchema = new Schema<INigeriaLocation>(
  {
    state: {
      type: String,
      required: true,
      unique: true,
    },
    lgas: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true },
);

export const NigeriaLocation = mongoose.model<INigeriaLocation>(
  'NigeriaLocation',
  nigeriaLocationSchema,
);
