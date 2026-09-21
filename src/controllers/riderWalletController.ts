import { NextFunction, Request, Response } from 'express';
import { IRider } from '../models/riderModel';
import { RiderWalletService } from '../services/riderWalletService';

type RiderAuthRequest = Request & { rider?: IRider };

function getRiderId(req: RiderAuthRequest): string {
  return (req.rider as any)._id.toString();
}

export class RiderWalletController {
  static async getWallet(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const wallet = await RiderWalletService.getWallet(getRiderId(req));
      res.status(200).json({ status: 'success', data: wallet });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await RiderWalletService.getTransactions(getRiderId(req), page, limit);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async withdraw(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RiderWalletService.requestWithdrawal(getRiderId(req), req.body.amount);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }
}
