import { Watchlist } from '../models/watchlistModel';
import { Product } from '../models/productModel';
import { CustomError } from '../middlewares/errorHandler';

export class WatchlistService {
  static async addWatchlist(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw new CustomError('Product not found', 404, 'fail');

    const watchlist = new Watchlist({
      user: userId,
      product: productId,
    });

    return await watchlist.save();
  }

  static async removeWatchlist(userId: string, productId: string) {
    const result = await Watchlist.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!result) throw new CustomError('Watchlist not found', 404, 'fail');
    return result;
  }

  static async getUserWatchlists(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await Watchlist.find({ user: userId })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name price images seller')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
  }

  static async checkWatchlist(userId: string, productId: string) {
    const watchlist = await Watchlist.findOne({
      user: userId,
      product: productId,
    });
    return { isWatchlist: !!watchlist };
  }
}
