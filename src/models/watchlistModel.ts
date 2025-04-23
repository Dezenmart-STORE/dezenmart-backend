import { Schema, model, Document } from 'mongoose';

interface IWatchlist extends Document {
  user: Schema.Types.ObjectId;
  product: Schema.Types.ObjectId;
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true }
}, { timestamps: true });

// Ensure one watchlist record per user-product pair
WatchlistSchema.index({ user: 1, product: 1 }, { unique: true });

export const Watchlist = model<IWatchlist>('Watchlist', WatchlistSchema);