import { Request, Response } from 'express';
import { ExchangeRateService } from '../services/exchangeRateService';

export class ExchangeRateController {
  /**
   * Admin sets a new USD to Token exchange rate.
   */
  static async setRate(req: Request, res: Response): Promise<void> {
    const { usdAmount, tokenAmount } = req.body;
    const rate = await ExchangeRateService.setExchangeRate(Number(usdAmount), Number(tokenAmount));
    res.status(200).json({
      status: 'success',
      data: { rate },
    });
  }

  /**
   * Fetches the current exchange rate (Public access).
   */
  static async getRate(req: Request, res: Response): Promise<void> {
    const rate = await ExchangeRateService.getExchangeRate();
    res.status(200).json({
      status: 'success',
      data: { rate },
    });
  }

  /**
   * Updates a user's token balance (Increase or Decrease).
   * Typically Admin-controlled or triggered by a payment/usage event.
   */
  static async updateUserTokens(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    const { amount } = req.body; // positive to add, negative to subtract
    const newBalance = await ExchangeRateService.updateUserTokens(userId, Number(amount));
    res.status(200).json({
      status: 'success',
      data: { balance: newBalance },
    });
  }

  /**
   * User purchases tokens with USD.
   * Logic: (USD Paid / Rate USD) * Rate Tokens
   */
  static async purchaseTokens(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { usdAmount } = req.body;
    const balance = await ExchangeRateService.purchaseTokens(userId, Number(usdAmount));
    res.status(200).json({
      status: 'success',
      message: 'Tokens purchased successfully',
      data: { balance },
    });
  }

  /**
   * User spends tokens.
   */
  static async spendTokens(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.id;
    const { tokenAmount } = req.body;
    const balance = await ExchangeRateService.spendTokens(userId, Number(tokenAmount));
    res.status(200).json({
      status: 'success',
      message: 'Tokens spent successfully',
      data: { balance },
    });
  }
}
