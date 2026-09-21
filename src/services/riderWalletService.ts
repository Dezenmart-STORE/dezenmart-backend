import { CustomError } from '../middlewares/errorHandler';
import { RiderWallet } from '../models/riderWalletModel';
import { RiderWalletTransaction, RiderWalletTransactionReason } from '../models/riderWalletTransactionModel';
import { RiderWithdrawal } from '../models/riderWithdrawalModel';
import { Rider } from '../models/riderModel';
import { Types } from 'mongoose';

const MIN_WITHDRAWAL_AMOUNT = 1000;

async function getOrCreateWallet(riderId: string) {
  const wallet = await RiderWallet.findOneAndUpdate(
    { rider: riderId },
    { $setOnInsert: { rider: riderId } },
    { upsert: true, new: true },
  );
  return wallet;
}

export class RiderWalletService {
  static async creditForBooking(
    riderId: string,
    bookingId: string,
    amount: number,
  ) {
    const wallet = await RiderWallet.findOneAndUpdate(
      { rider: riderId },
      { $inc: { balance: amount, totalEarned: amount }, $setOnInsert: { rider: riderId } },
      { upsert: true, new: true },
    );

    await RiderWalletTransaction.create({
      rider: riderId,
      wallet: wallet._id,
      type: 'credit',
      reason: 'booking_earning' as RiderWalletTransactionReason,
      amount,
      balanceAfter: wallet.balance,
      booking: bookingId,
    });

    return wallet;
  }

  static async getWallet(riderId: string) {
    const wallet = await getOrCreateWallet(riderId);
    return {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      currency: wallet.currency,
    };
  }

  static async getTransactions(riderId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { rider: riderId };
    const [items, total] = await Promise.all([
      RiderWalletTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RiderWalletTransaction.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  static async requestWithdrawal(riderId: string, amount: number) {
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new CustomError(
        `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT}`,
        400,
        'fail',
      );
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      throw new CustomError('Rider not found', 404, 'fail');
    }
    if (!rider.bankName || !rider.bankAccountNumber || !rider.bankAccountName) {
      throw new CustomError('Add your bank details before requesting a withdrawal', 400, 'fail');
    }

    const wallet = await RiderWallet.findOneAndUpdate(
      { rider: riderId, balance: { $gte: amount } },
      { $inc: { balance: -amount, totalWithdrawn: amount } },
      { new: true },
    );

    if (!wallet) {
      throw new CustomError('Insufficient wallet balance', 400, 'fail');
    }

    const withdrawal = await RiderWithdrawal.create({
      rider: riderId,
      amount,
      bankName: rider.bankName,
      bankAccountNumber: rider.bankAccountNumber,
      bankAccountName: rider.bankAccountName,
    });

    await RiderWalletTransaction.create({
      rider: riderId,
      wallet: wallet._id,
      type: 'debit',
      reason: 'withdrawal' as RiderWalletTransactionReason,
      amount,
      balanceAfter: wallet.balance,
      withdrawal: withdrawal._id as Types.ObjectId,
    });

    return {
      withdrawalId: withdrawal._id,
      status: withdrawal.status,
      amount: withdrawal.amount,
      message: 'Withdrawal request received, it will be processed manually',
    };
  }
}
