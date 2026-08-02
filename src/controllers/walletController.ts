import { NextFunction, Request, Response } from 'express';
import { WalletService } from '../services/walletService';
import { CustomError } from '../middlewares/errorHandler';

export class WalletController {
  static getStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !(req.user as any).id) {
        throw new CustomError('User not authenticated', 401, 'fail');
      }
      const status = await WalletService.getWalletStatus((req.user as any).id);
      res.status(200).json({ status: 'success', data: status });
    } catch (error) {
      next(error);
    }
  };

  static setup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !(req.user as any).id) {
        throw new CustomError('User not authenticated', 401, 'fail');
      }
      const { walletAddress, chainId, provider, dynamicUserId } = req.body;
      const status = await WalletService.setupWallet((req.user as any).id, {
        walletAddress,
        chainId,
        provider,
        dynamicUserId,
      });
      res.status(200).json({ status: 'success', data: status });
    } catch (error) {
      next(error);
    }
  };
}
