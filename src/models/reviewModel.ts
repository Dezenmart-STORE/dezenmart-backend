import { Schema, model, Document } from 'mongoose';

export interface IReview extends Document {
  reviewer: Schema.Types.ObjectId;
  reviewed: Schema.Types.ObjectId;
  order: Schema.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewed: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

// Ensure one review per order
ReviewSchema.index({ order: 1 }, { unique: true });

export const Review = model<IReview>('Review', ReviewSchema);
