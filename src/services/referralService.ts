import { User } from '../models/userModel';
import { RewardService } from './rewardService';
import { RewardActionType } from '../models/rewardModel';
import { CustomError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';

export class ReferralService {
  static async generateReferralCode(userId: string): Promise<string> {
    const user = await User.findById(userId).select('referralCode');

    if (!user) throw new CustomError('User not found', 404, 'fail');

    if (!user.referralCode) {
      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await User.findByIdAndUpdate(userId, { $set: { referralCode: newCode } });
      return newCode;
    }
    return user.referralCode;
  }

  static async applyReferralCode(userId: string, referralCode: string) {
    const session = await User.startSession();
    session.startTransaction();

    try {
      const referrer = await User.findOne({
        referralCode,
      }).session(session);

      if (!referrer) {
        throw new CustomError('Invalid referral code', 400, 'fail');
      }

      // Check for self-referral
      if ((referrer._id as Types.ObjectId).toString() === userId) {
        throw new CustomError(
          'You cannot use your own referral code',
          400,
          'fail',
        );
      }

      const userApplying = await User.findById(userId).session(session);
      if (!userApplying) {
        throw new CustomError('User applying the code not found', 404, 'fail');
      }

      if (userApplying.referredBy || userApplying.isReferralCodeUsed) {
        throw new CustomError(
          'Referral code already applied or user has already been referred',
          400,
          'fail',
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            referredBy: referrer._id,
            isReferralCodeUsed: true,
          },
        },
        { new: true, session },
      );

      if (!updatedUser) {
        throw new CustomError(
          'Failed to update user with referral code',
          500,
          'error',
        );
      }

      await User.findByIdAndUpdate(
        referrer._id,
        { $inc: { referralCount: 1 } },
        { session },
      );

      await session.commitTransaction();
      return updatedUser;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async processReferralRewards(referredUserId: string) {
    try {
      const referredUser = await User.findById(referredUserId)
        .select('referredBy')
        .populate<{ referredBy: { _id: Types.ObjectId } }>('referredBy', '_id');

      if (!referredUser || !referredUser.referredBy) {
        return;
      }

      const referrerId = referredUser.referredBy._id;
      const referrerIdString = referrerId.toString();

      await RewardService.awardPoints(
        referrerIdString,
        RewardActionType.REFERRAL_BONUS,
        referredUserId,
        { referredUserId: referredUserId },
      );
    } catch (error) {
      console.error(
        `Failed to process referral rewards for referrer of user ${referredUserId}:`,
        error,
      );
    }
  }
}
