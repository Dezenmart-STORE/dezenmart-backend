import { Reward, RewardActionType, IReward } from '../models/rewardModel';
import { User } from '../models/userModel';
import { Order } from '../models/orderModel';
import { CustomError } from '../middlewares/errorHandler';
import { WebSocketService } from './webSocketService';
import { Types } from 'mongoose';
import { Review } from '../models/reviewModel';

type PopulatedOrderProduct = { seller: Types.ObjectId };
type PopulatedOrderBuyer = { _id: Types.ObjectId };

export class RewardService {
  private static readonly REWARD_VALUES = {
    [RewardActionType.PRODUCT_SOLD]: 100,
    [RewardActionType.DELIVERY_CONFIRMED]: 20,
    [RewardActionType.FIVE_STAR_REVIEW]: 10,
    [RewardActionType.SALES_MILESTONE]: 200,
    [RewardActionType.FIRST_PURCHASE]: 50,
    [RewardActionType.PURCHASE_MILESTONE]: 100,
    [RewardActionType.TESTNET_BONUS_SELLER]: 50,
    [RewardActionType.TESTNET_BONUS_BUYER]: 25,
    [RewardActionType.REFERRAL_BONUS]: 50,
  };
  private static webSocketService: WebSocketService;

  public static initialize(webSocketService: WebSocketService) {
    RewardService.webSocketService = webSocketService;
  }

  private static readonly MILESTONE_INTERVAL = 10;

  static async awardPoints(
    userId: string,
    actionType: RewardActionType,
    referenceId?: string,
    metadata?: any,
  ): Promise<IReward> {
    const points = this.REWARD_VALUES[actionType];
    if (!points) {
      throw new CustomError('Invalid reward action type', 400, 'fail');
    }

    let validReferenceId: Types.ObjectId | undefined;
    if (referenceId) {
      if (!Types.ObjectId.isValid(referenceId)) {
        console.warn(`Invalid referenceId format provided: ${referenceId}`);
      } else {
        validReferenceId = new Types.ObjectId(referenceId);
      }
    }

    const session = await Reward.startSession();
    session.startTransaction();

    try {
      // Create reward record
      const reward = new Reward({
        userId,
        actionType,
        points,
        referenceId: validReferenceId,
        metadata,
      });

      const savedReward = await reward.save({ session });

      // Update user's points
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { totalPoints: points, availablePoints: points },
          $set: { lastRewardCalculation: new Date() },
        },
        { session, new: true, upsert: false },
      );

      if (!updatedUser) {
        await session.abortTransaction();
        session.endSession();
        throw new CustomError('User not found', 404, 'fail');
      }

      if (this.webSocketService && savedReward?._id) {
        await this.webSocketService.notifyReward(savedReward._id.toString());
      }
      await session.commitTransaction();

      return savedReward;
    } catch (error) {
      await session.abortTransaction();
      console.error(
        `Error awarding points for action ${actionType} to user ${userId}:`,
        error,
      ); // Log detailed error

      throw error;
    } finally {
      session.endSession();
    }
  }

  static async processOrderRewards(orderId: string) {
    const order = await Order.findById(orderId)
      .populate<{ product: PopulatedOrderProduct; buyer: PopulatedOrderBuyer }>( // Use populate generics
        'product',
        'seller', // Select only seller from product
      )
      .populate<{ buyer: PopulatedOrderBuyer }>('buyer') // Populate buyer fully (or select specific fields)
      .exec(); // Use exec() for better promise handling with population

    if (!order) throw new CustomError('Order not found', 404, 'fail');

    if (!order.product || !order.product.seller || !order.buyer) {
      throw new CustomError(
        'Failed to populate order details for rewards',
        500,
        'error',
      );
    }

    const productSellerId = order.product.seller; // Now TS knows product has a seller field
    const buyerId = order.buyer._id;

    const isTestnet = process.env.NETWORK_ENV === 'testnet';
    const session = await Reward.startSession();
    session.startTransaction();

    try {
      // Seller rewards
      await this.awardPoints(
        productSellerId.toString(),
        RewardActionType.PRODUCT_SOLD,
        orderId,
        { orderId },
      );

      // Check if this is seller's first sale (example)
      const sellerSalesCount = await Order.countDocuments({
        seller: productSellerId,
        status: 'completed',
      });

      if (sellerSalesCount % this.MILESTONE_INTERVAL === 0) {
        await this.awardPoints(
          productSellerId.toString(),
          RewardActionType.SALES_MILESTONE,
          orderId,
          { milestoneCount: sellerSalesCount / this.MILESTONE_INTERVAL },
        );
      }

      // Buyer rewards
      const buyerPurchaseCount = await Order.countDocuments({
        buyer: buyerId,
        status: 'completed',
      }).session(session);

      if (buyerPurchaseCount === 1) {
        await this.awardPoints(
          buyerId.toString(),
          RewardActionType.FIRST_PURCHASE,
          orderId,
        );
      }

      if (buyerPurchaseCount % this.MILESTONE_INTERVAL === 0) {
        await this.awardPoints(
          buyerId.toString(),
          RewardActionType.PURCHASE_MILESTONE,
          orderId,
          { milestoneCount: buyerPurchaseCount / this.MILESTONE_INTERVAL },
        );
      }

      // Testnet bonuses
      if (isTestnet) {
        await this.awardPoints(
          productSellerId.toString(),
          RewardActionType.TESTNET_BONUS_SELLER,
          orderId,
        );
        await this.awardPoints(
          buyerId.toString(),
          RewardActionType.TESTNET_BONUS_BUYER,
          orderId,
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async processDeliveryConfirmation(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    await this.awardPoints(
      order.seller.toString(),
      RewardActionType.DELIVERY_CONFIRMED,
      orderId,
    );

    await this.awardPoints(
      order.buyer.toString(),
      RewardActionType.DELIVERY_CONFIRMED,
      orderId,
    );
  }

  static async processFiveStarReview(reviewId: string) {
    const review = await Review.findById(reviewId)
      .populate<{ order: { seller: Types.ObjectId; buyer: Types.ObjectId } }>( // Populate order and specify nested fields needed
        'order',
        'seller buyer', // Select only seller and buyer from the order
      )
      .exec();

    if (!review) throw new CustomError('Review not found', 404, 'fail');
    if (review.rating !== 5) return; // Only 5-star reviews get points

    if (!review.order || !review.order.seller || !review.order.buyer) {
      throw new CustomError(
        'Failed to populate order details for review reward',
        500,
        'error',
      );
    }

    await this.awardPoints(
      review.order.seller.toString(),
      RewardActionType.FIVE_STAR_REVIEW,
      reviewId,
    );

    await this.awardPoints(
      review.order.buyer.toString(),
      RewardActionType.FIVE_STAR_REVIEW,
      reviewId,
    );
  }

  static async getUserRewards(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await Reward.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getUserPointsSummary(userId: string) {
    return await User.findById(userId).select(
      'totalPoints availablePoints milestones',
    );
  }
}
