import { Review } from '../models/reviewModel';
import { Order } from '../models/orderModel';
import { User } from '../models/userModel';
import { CustomError } from '../middlewares/errorHandler';

export class ReviewService {
  static async createReview(reviewData: {
    reviewer: string;
    reviewed: string;
    order: string;
    rating: number;
    comment?: string;
  }) {
    // Verify the order exists and involves these users
    const order = await Order.findById(reviewData.order);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    if (
      (order.buyer.toString() !== reviewData.reviewer &&
        order.seller.toString() !== reviewData.reviewer) ||
      (order.buyer.toString() !== reviewData.reviewed &&
        order.seller.toString() !== reviewData.reviewed)
    ) {
      throw new CustomError('Invalid review participants', 403, 'fail');
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ order: reviewData.order });
    if (existingReview) {
      throw new CustomError(
        'Review already exists for this order',
        400,
        'fail',
      );
    }

    const review = new Review(reviewData);
    await review.save();

    // Update user's average rating
    await this.updateUserRating(reviewData.reviewed);

    return review;
  }

  static async updateUserRating(userId: string) {
    const result = await Review.aggregate([
      { $match: { reviewed: userId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]);

    const averageRating = result[0]?.averageRating || 0;
    await User.findByIdAndUpdate(userId, { rating: averageRating });
  }

  static async getReviewsForUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await Review.find({ reviewed: userId })
      .skip(skip)
      .limit(limit)
      .populate('reviewer', 'username profileImage')
      .populate('order', 'product')
      .sort({ createdAt: -1 });
  }

  static async getReviewForOrder(orderId: string) {
    return await Review.findOne({ order: orderId })
      .populate('reviewer', 'username profileImage')
      .populate('reviewed', 'username profileImage');
  }
}
