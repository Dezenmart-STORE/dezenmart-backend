import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/userModel';
import { CustomError } from '../middlewares/errorHandler';
import { PaymentService } from '../services/paymentService';
import { PaymentProvider } from '../services/paymentGateways/paymentGatewayService';

type AuthRequest = Request & { user?: IUser };

function getUserId(req: AuthRequest): string | null {
  return (req.user as any)?._id?.toString() ?? (req.user as any)?.id ?? null;
}

export class PaymentController {
  static async getBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.query.provider as PaymentProvider;
      const banks = await PaymentService.getBanks(provider);
      res.status(200).json({ status: 'success', data: { banks } });
    } catch (error) {
      next(error);
    }
  }

  static async resolveAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountNumber, bankCode, provider } = req.body;
      const result = await PaymentService.resolveAccount(provider, accountNumber, bankCode);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getFiatAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      if (!userId) return next(new CustomError('User not authenticated', 401, 'fail'));

      const fiatAccount = await PaymentService.getUserFiatAccount(userId);
      res.status(200).json({ status: 'success', data: { fiatAccount } });
    } catch (error) {
      next(error);
    }
  }

  static async setFiatAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      if (!userId) return next(new CustomError('User not authenticated', 401, 'fail'));

      const fiatAccount = await PaymentService.setUserFiatAccount(userId, req.body);
      res.status(200).json({ status: 'success', data: { fiatAccount } });
    } catch (error) {
      next(error);
    }
  }

  static async handlePaystackWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await PaymentService.handleWebhook(
        'paystack',
        req.rawBody,
        req.headers as Record<string, unknown>,
        req.body,
      );
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }

  static async handleFlutterwaveWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      await PaymentService.handleWebhook(
        'flutterwave',
        req.rawBody,
        req.headers as Record<string, unknown>,
        req.body,
      );
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }
}
