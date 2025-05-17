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

  static async getLogisticsProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await contractService.getLogisticsProviders();
      res.status(200).json({
        status: 'success',
        data: providers,
      });
    } catch (error) {
      console.error('Error in getLogisticsProviders controller:', error);
      next(error);
    }
  }

  static async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { tradeId } = req.params;
      const { winner } = req.body;

      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }
      if (!winner || !/^0x[a-fA-F0-9]{40}$/.test(winner)) {
        return next(
          new CustomError('Valid winner address is required', 400, 'fail'),
        );
      }

      console.log(
        `API: Resolving dispute for trade ${tradeId}, winner: ${winner}`,
      );

      const receipt = await contractService.resolveDispute(tradeId, winner);
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
        productCost,
        logisticsProviders,
        logisticsCosts,
        useUSDT,
        totalQuantity,
      } = req.body;

      // Validate product cost
      if (
        !productCost ||
        isNaN(Number(productCost)) ||
        Number(productCost) <= 0
      ) {
        return next(
          new CustomError('Valid product cost is required', 400, 'fail'),
        );
      }

      // Validate logistics providers and costs
      if (!Array.isArray(logisticsProviders) || logisticsProviders.length === 0) {
        return next(
          new CustomError('At least one logistics provider is required', 400, 'fail'),
        );
      }

      if (!Array.isArray(logisticsCosts) || logisticsCosts.length === 0) {
        return next(
          new CustomError('At least one logistics cost is required', 400, 'fail'),
        );
      }

      if (logisticsProviders.length !== logisticsCosts.length) {
        return next(
          new CustomError('Logistics providers and costs arrays must be the same length', 400, 'fail'),
        );
      }

      // Validate each provider address
      for (const provider of logisticsProviders) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(provider)) {
          return next(
            new CustomError(`Invalid logistics provider address: ${provider}`, 400, 'fail'),
          );
        }
      }

      // Validate each cost
      for (const cost of logisticsCosts) {
        if (isNaN(Number(cost)) || Number(cost) <= 0) {
          return next(
            new CustomError(`Invalid logistics cost: ${cost}`, 400, 'fail'),
          );
        }
      }

      // Validate useUSDT flag
      if (useUSDT === undefined || typeof useUSDT !== 'boolean') {
        return next(
          new CustomError('useUSDT flag (boolean) is required', 400, 'fail'),
        );
      }

      // Validate total quantity
      if (!totalQuantity || isNaN(Number(totalQuantity)) || Number(totalQuantity) <= 0) {
        return next(
          new CustomError('Valid total quantity is required', 400, 'fail'),
        );
      }

      console.log('Creating trade with params:', {
        productCost,
        logisticsProviders,
        logisticsCosts,
        useUSDT,
        totalQuantity
      });

      // Create the trade
      const receipt = await contractService.createTrade(
        productCost,
        logisticsProviders,
        logisticsCosts,
        totalQuantity
      );

      const updateMessage =
        'Blockchain transaction sent. Order linking relies on event listener.';
      console.log(
        `Trade creation Tx sent for ${receipt.transactionHash}. Waiting for event listener to link.`,
      );

      let extractedTradeId: string | undefined;

      if (receipt.events) {
        // Attempt 1: From TradeCreated event (generally preferred)
        if (receipt.events.TradeCreated) {
          const tradeCreatedEvent = receipt.events.TradeCreated;
          // Handle if TradeCreated is an array or a single object
          const eventInstance = Array.isArray(tradeCreatedEvent) ? tradeCreatedEvent[0] : tradeCreatedEvent;
          if (eventInstance && eventInstance.returnValues) {
            extractedTradeId = eventInstance.returnValues.tradeId;
          }
        }

        // Attempt 2: From LogisticsSelected event if TradeCreated didn't yield ID
        if (!extractedTradeId && receipt.events.LogisticsSelected) {
          const logisticsEvents = receipt.events.LogisticsSelected;
          // Handle if LogisticsSelected is an array or a single object
          const firstEventInstance = Array.isArray(logisticsEvents) ? logisticsEvents[0] : logisticsEvents;
          if (firstEventInstance && firstEventInstance.returnValues) {
            extractedTradeId = firstEventInstance.returnValues.tradeId;
          }
        }
      }

      res.status(201).json({
        status: 'success',
        message: `Trade creation transaction sent. ${updateMessage}`,
        data: {
          transactionHash: receipt.transactionHash,
          tradeId: extractedTradeId,
        },
      });
    } catch (error) {
      console.error('Error in createTrade controller:', error);
      next(error);
    }
  }

  static async buyTrade(req: Request, res: Response, next: NextFunction) {
    try {
      const { tradeId } = req.params;
      const { quantity, logisticsProvider } = req.body;

      // Validate tradeId
      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      // Validate quantity
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        return next(new CustomError('Valid quantity is required', 400, 'fail'));
      }

      // Validate logistics provider index
      if (logisticsProvider === undefined || logisticsProvider < 0) {
        return next(new CustomError('Valid logistics provider is required', 400, 'fail'));
      }

      // Get trade to determine if it uses USDT
      const trade = await contractService.getTrade(tradeId);
      
      // Buy the trade
      const receipt = await contractService.buyTrade(
        tradeId,
        quantity,
        logisticsProvider
      );

      res.status(200).json({
        status: 'success',
        message: 'Trade purchase transaction sent',
        data: { 
          transactionHash: receipt.transactionHash,
        },
      });
    } catch (error) {
      console.error('Error in buyTrade controller:', error);
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

      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const receipt = await contractService.confirmDelivery(tradeId);

      res.status(200).json({
        status: 'success',
        message: 'Delivery confirmation transaction sent',
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

      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const receipt = await contractService.cancelTrade(tradeId);

      res.status(200).json({
        status: 'success',
        message: 'Trade cancellation transaction sent',
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

      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const receipt = await contractService.raiseDispute(tradeId);

      res.status(200).json({
        status: 'success',
        message: 'Dispute raising transaction sent',
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

      if (!tradeId || isNaN(parseInt(tradeId, 10)) || parseInt(tradeId, 10) < 0) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const tradeDetails = await contractService.getTrade(tradeId);

      res.status(200).json({
        status: 'success',
        data: tradeDetails,
      });
    } catch (error) {
      console.error('Error in getTradeDetails controller:', error);
      if (
        error instanceof Error &&
        error.message.includes('Failed to get trade')
      ) {
        return next(new CustomError('Trade not found', 404, 'fail'));
      }
      next(error);
    }
  }

  static async getTradesByBuyer(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const trades = await contractService.getTradesByBuyer();

      res.status(200).json({
        status: 'success',
        data: trades,
      });
    } catch (error) {
      console.error('Error in getTradesByBuyer controller:', error);
      next(error);
    }
  }

  static async getTradesBySeller(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const trades = await contractService.getTradesBySeller();

      res.status(200).json({
        status: 'success',
        data: trades,
      });
    } catch (error) {
      console.error('Error in getTradesBySeller controller:', error);
      next(error);
    }
  }

  static async withdrawEscrowFeesETH(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const receipt = await contractService.withdrawEscrowFeesETH();

      res.status(200).json({
        status: 'success',
        message: 'ETH escrow fees withdrawal transaction sent',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in withdrawEscrowFeesETH controller:', error);
      next(error);
    }
  }

  static async withdrawEscrowFeesUSDT(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const receipt = await contractService.withdrawEscrowFeesUSDT();

      res.status(200).json({
        status: 'success',
        message: 'USDT escrow fees withdrawal transaction sent',
        data: { transactionHash: receipt.transactionHash },
      });
    } catch (error) {
      console.error('Error in withdrawEscrowFeesUSDT controller:', error);
      next(error);
    }
  }
}