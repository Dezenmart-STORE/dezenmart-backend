// src/controllers/contractController.ts
import { Request, Response, NextFunction } from 'express';
import { contractService } from '../server';
import { CustomError } from '../middlewares/errorHandler';

export class ContractController {
  static async registerLogisticsProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { providerAddress } = req.body;
      if (!providerAddress || !/^0x[a-fA-F0-9]{40}$/.test(providerAddress)) {
        return next(
          new CustomError('Valid provider address is required', 400, 'fail'),
        );
      }
      console.log(`API: Registering logistics provider ${providerAddress}`);

      const receipt =
        await contractService.registerLogisticsProvider(providerAddress);
      res.status(200).json({
        status: 'success',
        message: 'Logistics provider registration transaction sent',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in registerLogisticsProvider controller:', error);
      next(error);
    }
  }

  static async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { tradeId } = req.params;
      const { winner } = req.body;
      const tradeIdNum = parseInt(tradeId, 10);

      if (isNaN(tradeIdNum) || tradeIdNum < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }
      if (!winner || !/^0x[a-fA-F0-9]{40}$/.test(winner)) {
        return next(
          new CustomError('Valid winner address is required', 400, 'fail'),
        );
      }

      console.log(
        `API: Resolving dispute for trade ${tradeIdNum}, winner: ${winner}`,
      );

      const receipt = await contractService.resolveDispute(tradeIdNum, winner);
      res.status(200).json({
        status: 'success',
        message: 'Dispute resolution transaction sent',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in resolveDispute controller:', error);
      next(error);
    }
  }

  static async createTrade(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        seller,
        productCost,
        logisticsProvider,
        logisticsCost,
        useUSDT,
        orderId,
      } = req.body;

      if (!seller || !/^0x[a-fA-F0-9]{40}$/.test(seller)) {
        return next(
          new CustomError('Valid seller address is required', 400, 'fail'),
        );
      }
      if (
        !logisticsProvider ||
        !/^0x[a-fA-F0-9]{40}$/.test(logisticsProvider)
      ) {
        return next(
          new CustomError(
            'Valid logistics provider address is required',
            400,
            'fail',
          ),
        );
      }
      if (
        !productCost ||
        isNaN(Number(productCost)) ||
        Number(productCost) <= 0
      ) {
        return next(
          new CustomError('Valid product cost is required', 400, 'fail'),
        );
      }
      if (
        !logisticsCost ||
        isNaN(Number(logisticsCost)) ||
        Number(logisticsCost) < 0
      ) {
        return next(
          new CustomError('Valid logistics cost is required', 400, 'fail'),
        );
      }
      if (useUSDT === undefined || typeof useUSDT !== 'boolean') {
        return next(
          new CustomError('useUSDT flag (boolean) is required', 400, 'fail'),
        );
      }
      if (!orderId) {
        return next(
          new CustomError(
            'Internal orderId is required for tracking',
            400,
            'fail',
          ),
        );
      }

      let receipt;
      if (useUSDT) {
        receipt = await contractService.createTradeWithUSDT(
          seller,
          productCost,
          logisticsProvider,
          logisticsCost,
        );
      } else {
        receipt = await contractService.createTradeWithETH(
          seller,
          productCost,
          logisticsProvider,
          logisticsCost,
        );
      }

      const updateMessage =
        'Blockchain transaction sent. Order linking relies on event listener.';
      console.log(
        `Trade creation Tx sent for Order ${orderId}: ${receipt.transactionHash}. Waiting for event listener to link.`,
      );
      // ---

      res.status(201).json({
        status: 'success',
        message: `Trade creation transaction sent. ${updateMessage}`,
        data: {
          transactionHash: receipt.transactionHash,
        },
      });
    } catch (error) {
      console.error('Error in createTrade controller:', error);
      next(error);
    }
  }

  static async confirmDelivery(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { tradeId } = req.params;
      const tradeIdNum = parseInt(tradeId, 10);

      if (isNaN(tradeIdNum) || tradeIdNum < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      // No longer passing buyerAddress
      const receipt = await contractService.confirmDelivery(tradeIdNum);

      res.status(200).json({
        status: 'success',
        message: 'Delivery confirmation transaction sent (using server key)',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in confirmDelivery controller:', error);
      next(error);
    }
  }

  static async cancelTrade(req: Request, res: Response, next: NextFunction) {
    try {
      const { tradeId } = req.params;
      const tradeIdNum = parseInt(tradeId, 10);

      if (isNaN(tradeIdNum) || tradeIdNum < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      // No longer passing buyerAddress
      const receipt = await contractService.cancelTrade(tradeIdNum);

      res.status(200).json({
        status: 'success',
        message: 'Trade cancellation transaction sent (using server key)',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in cancelTrade controller:', error);
      next(error);
    }
  }

  static async raiseDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { tradeId } = req.params;
      const tradeIdNum = parseInt(tradeId, 10);

      if (isNaN(tradeIdNum) || tradeIdNum < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      // No longer passing disputerAddress
      const receipt = await contractService.raiseDispute(tradeIdNum);

      res.status(200).json({
        status: 'success',
        message: 'Dispute raising transaction sent (using server key)',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in raiseDispute controller:', error);
      next(error);
    }
  }

  static async getTradeDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { tradeId } = req.params;
      const tradeIdNum = parseInt(tradeId, 10);

      if (isNaN(tradeIdNum) || tradeIdNum < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const tradeDetails = await contractService.getTrade(tradeIdNum);

      res.status(200).json({
        status: 'success',
        data: tradeDetails,
      });
    } catch (error) {
      console.error('Error in getTradeDetails controller:', error);
      if (
        error instanceof Error &&
        error.message.includes('Failed to fetch details')
      ) {
        return next(new CustomError('Trade not found', 404, 'fail'));
      }
      next(error);
    }
  }
}
