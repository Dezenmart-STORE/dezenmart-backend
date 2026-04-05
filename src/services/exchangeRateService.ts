import { ExchangeRate, IExchangeRate } from '../models/exchangeRateModel';
import { User } from '../models/userModel';
import { CustomError } from '../middlewares/errorHandler';

export class ExchangeRateService {
  /**
   * Sets the current exchange rate. If a rate already exists, it updates it.
   * Otherwise, it creates a new entry.
   */
  static async setExchangeRate(usdAmount: number, tokenAmount: number): Promise<IExchangeRate> {
    if (usdAmount <= 0 || tokenAmount <= 0) {
      throw new CustomError('Amounts must be greater than 0', 400, 'fail');
    }

    let rate = await ExchangeRate.findOne();
    if (rate) {
      rate.usdAmount = usdAmount;
      rate.tokenAmount = tokenAmount;
      return await rate.save();
    } else {
      return await ExchangeRate.create({ usdAmount, tokenAmount });
    }
  }

  /**
   * Fetches the current exchange rate.
   */
  static async getExchangeRate(): Promise<IExchangeRate | null> {
    return await ExchangeRate.findOne();
  }

  /**
   * Updates a user's token balance by a specific amount.
   * This amount can be positive (for adding tokens) or negative (for spending tokens).
   */
  static async updateUserTokens(userId: string, amount: number): Promise<number> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'fail');
    }

    // Check for negative balance before decrementing
    if (amount < 0 && user.tokenBalance + amount < 0) {
      throw new CustomError('Insufficient token balance', 400, 'fail');
    }

    user.tokenBalance += amount;
    await user.save();
    return user.tokenBalance;
  }

  /**
   * Allows a user to purchase tokens based on the current exchange rate.
   * Calculated as: (USD Paid / Rate USD Amount) * Rate Token Amount
   */
  static async purchaseTokens(userId: string, usdAmount: number): Promise<number> {
    if (usdAmount <= 0) {
      throw new CustomError('USD amount must be greater than 0', 400, 'fail');
    }

    const rate = await ExchangeRate.findOne();
    if (!rate) {
      throw new CustomError('Exchange rate not set by admin', 500, 'error');
    }

    const tokensToCredit = (usdAmount / rate.usdAmount) * rate.tokenAmount;
    
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'fail');
    }

    user.tokenBalance += tokensToCredit;
    await user.save();
    return user.tokenBalance;
  }

  /**
   * Allows a user to spend their tokens.
   */
  static async spendTokens(userId: string, tokenAmount: number): Promise<number> {
    if (tokenAmount <= 0) {
      throw new CustomError('Token amount must be greater than 0', 400, 'fail');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'fail');
    }

    if (user.tokenBalance < tokenAmount) {
      throw new CustomError('Insufficient token balance', 400, 'fail');
    }

    user.tokenBalance -= tokenAmount;
    await user.save();
    return user.tokenBalance;
  }
}
