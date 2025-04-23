import { Order } from '../models/orderModel';
import { Review } from '../models/reviewModel';
import { User } from '../models/userModel';
import { Reward } from '../models/rewardModel';
import { CustomError } from '../middlewares/errorHandler';

export class AntiSpamService {
  static async validateReview(reviewerId: string, orderId: string) {
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      throw new CustomError(
        'You have already reviewed this order',
        400,
        'fail',
      );
    }

    const order = await Order.findOne({
      _id: orderId,
      buyer: reviewerId,
      status: 'completed',
    });
    if (!order) {
      throw new CustomError(
        'You can only review products you purchased',
        403,
        'fail',
      );
    }
  }

  static async detectSuspiciousActivity(userId: string) {
    const recentOrders = await Order.countDocuments({
      $or: [{ buyer: userId }, { 'product.seller': userId }],
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentOrders > 20) {
      await User.findByIdAndUpdate(userId, { isSuspended: true });
      throw new CustomError(
        'Account temporarily suspended for suspicious activity',
        429,
        'fail',
      );
    }
  }

  static async validateMilestone(userId: string, actionType: string) {
    const existingReward = await Reward.findOne({
      userId,
      actionType,
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (existingReward) {
      throw new CustomError(
        'Milestone reward already claimed recently',
        400,
        'fail',
      );
    }
  }
}
