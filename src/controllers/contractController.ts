import { Request, Response, NextFunction } from 'express';
import { contractService } from '../server';
import { CustomError } from '../middlewares/errorHandler';

function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  
  return obj;
}

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

      const hash =
        await contractService.registerLogisticsProvider(providerAddress);
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Logistics provider registration transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in registerLogisticsProvider controller:', error);
      next(error);
    }
  }

  static async getLogisticsProviders(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
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
      const { purchaseId } = req.params;
      const { winner } = req.body;

      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }
      if (!winner || !/^0x[a-fA-F0-9]{40}$/.test(winner)) {
        return next(
          new CustomError('Valid winner address is required', 400, 'fail'),
        );
      }

      const hash = await contractService.resolveDispute(
        BigInt(purchaseId),
        winner,
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Dispute resolution transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in resolveDispute controller:', error);
      next(error);
    }
  }

  static async createTrade(req: Request, res: Response, next: NextFunction) {
    try {
      const { productCost, logisticsProviders, logisticsCosts, totalQuantity } =
        req.body;

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
      if (
        !Array.isArray(logisticsProviders) ||
        logisticsProviders.length === 0
      ) {
        return next(
          new CustomError(
            'At least one logistics provider is required',
            400,
            'fail',
          ),
        );
      }

      if (!Array.isArray(logisticsCosts) || logisticsCosts.length === 0) {
        return next(
          new CustomError(
            'At least one logistics cost is required',
            400,
            'fail',
          ),
        );
      }

      if (logisticsProviders.length !== logisticsCosts.length) {
        return next(
          new CustomError(
            'Logistics providers and costs arrays must be the same length',
            400,
            'fail',
          ),
        );
      }

      // Validate each provider address
      for (const provider of logisticsProviders) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(provider)) {
          return next(
            new CustomError(
              `Invalid logistics provider address: ${provider}`,
              400,
              'fail',
            ),
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

      // Validate total quantity
      if (
        !totalQuantity ||
        isNaN(Number(totalQuantity)) ||
        Number(totalQuantity) <= 0
      ) {
        return next(
          new CustomError('Valid total quantity is required', 400, 'fail'),
        );
      }

      // Create the trade - now returns both hash and tradeId
      const { hash, tradeId } = await contractService.createTrade(
        productCost.toString(),
        logisticsProviders,
        logisticsCosts.map((cost: number) => cost.toString()),
        BigInt(totalQuantity),
      );

      res.status(201).json({
        status: 'success',
        message: `Trade created successfully`,
        data: {
          transactionHash: hash,
          tradeId: tradeId.toString(),
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
      if (
        !tradeId ||
        isNaN(parseInt(tradeId, 10)) ||
        parseInt(tradeId, 10) < 0
      ) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      // Validate quantity
      if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        return next(new CustomError('Valid quantity is required', 400, 'fail'));
      }

      // Validate logistics provider
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

      // Get trade to verify it exists
      const trade = await contractService.getTrade(parseInt(tradeId, 10));
      if (!trade || !trade.active) {
        return next(
          new CustomError('Trade not found or inactive', 404, 'fail'),
        );
      }

      // Buy the trade - now returns both hash and purchaseId
      const { hash, purchaseId } = await contractService.buyTrade(
        parseInt(tradeId, 10),
        BigInt(quantity),
        logisticsProvider,
      );

      res.status(200).json({
        status: 'success',
        message: 'Trade purchase successful',
        data: {
          transactionHash: hash,
          purchaseId: purchaseId.toString(),
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
      const { purchaseId } = req.params;
      
      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }

      const hash = await contractService.confirmDelivery(purchaseId);
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Delivery confirmation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in confirmDelivery controller:', error);
      next(error);
    }
  }

  static async confirmPurchase(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { purchaseId } = req.params;

      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }

      const hash = await contractService.confirmPurchase(purchaseId);
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Purchase confirmation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in confirmPurchase controller:', error);
      next(error);
    }
  }

  static async cancelPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const { purchaseId } = req.params;

      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }

      const hash = await contractService.cancelPurchase(BigInt(purchaseId));
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Purchase cancellation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in cancelPurchase controller:', error);
      next(error);
    }
  }

  static async raiseDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const { purchaseId } = req.params;

      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }

      const hash = await contractService.raiseDispute(BigInt(purchaseId));
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Dispute raising transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
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

      if (
        !tradeId ||
        isNaN(parseInt(tradeId, 10)) ||
        parseInt(tradeId, 10) < 0
      ) {
        return next(new CustomError('Valid Trade ID is required', 400, 'fail'));
      }

      const tradeDetails = await contractService.getTrade(parseInt(tradeId, 10));

      // Format the response to include human-readable amounts
      const formattedTrade = {
        ...tradeDetails,
        productCostFormatted: contractService.formatUSDT(
          tradeDetails.productCost,
        ),
        escrowFeeFormatted: contractService.formatUSDT(tradeDetails.escrowFee),
        logisticsCostsFormatted: tradeDetails.logisticsCosts.map((cost) =>
          contractService.formatUSDT(cost),
        ),
        totalQuantity: JSON.stringify((tradeDetails.totalQuantity).toString()), 
        remainingQuantity: JSON.stringify((tradeDetails.remainingQuantity).toString()),
        purchaseIds: JSON.stringify(tradeDetails.purchaseIds.map((id) => id.toString())),
        logisticsProviders: tradeDetails.logisticsProviders.map((provider) => provider.toString()), 
        logisticsCosts: JSON.stringify(tradeDetails.logisticsCosts.map((cost) => cost.toString())),
        productCost: JSON.stringify(tradeDetails.productCost.toString()),
        escrowFee: JSON.stringify(tradeDetails.escrowFee.toString()),
        purchaseId: JSON.stringify(tradeDetails.purchaseIds.map((provider) => provider.toString())),
      };

      res.status(200).json({
        status: 'success',
        data: formattedTrade,
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

  static async getPurchaseDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { purchaseId } = req.params;

      if (
        !purchaseId ||
        isNaN(parseInt(purchaseId, 10)) ||
        parseInt(purchaseId, 10) < 0
      ) {
        return next(
          new CustomError('Valid Purchase ID is required', 400, 'fail'),
        );
      }

      const purchaseDetails = await contractService.getPurchase(
        BigInt(purchaseId),
      );

      // Format the response to include human-readable amounts
      const formattedPurchase = {
        ...purchaseDetails,
        purchaseId: purchaseDetails.purchaseId.toString(),
        tradeId: purchaseDetails.tradeId.toString(),
        quantity: purchaseDetails.quantity.toString(),
        totalAmountFormatted: contractService.formatUSDT(
          purchaseDetails.totalAmount,
        ),
        logisticsCostFormatted: contractService.formatUSDT(
          purchaseDetails.logisticsCost,
        ),
      };

      res.status(200).json({
        status: 'success',
        data: serializeBigInt(formattedPurchase),
      });
    } catch (error) {
      console.error('Error in getPurchaseDetails controller:', error);
      if (
        error instanceof Error &&
        error.message.includes('Failed to get purchase')
      ) {
        return next(new CustomError('Purchase not found', 404, 'fail'));
      }
      next(error);
    }
  }

  static async getBuyerPurchases(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const purchases = await contractService.getBuyerPurchases();

      // Format the purchases for better readability
      const formattedPurchases = purchases.map((purchase) => ({
        ...purchase,
        purchaseId: purchase.purchaseId.toString(),
        tradeId: purchase.tradeId.toString(),
        quantity: purchase.quantity.toString(),
        totalAmountFormatted: contractService.formatUSDT(purchase.totalAmount),
        logisticsCostFormatted: contractService.formatUSDT(
          purchase.logisticsCost,
        ),
      }));

      res.status(200).json({
        status: 'success',
        data: formattedPurchases,
      });
    } catch (error) {
      console.error('Error in getBuyerPurchases controller:', error);
      next(error);
    }
  }

  static async getSellerTrades(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const trades = await contractService.getSellerTrades();

      // Format the trades for better readability
      const formattedTrades = trades.map((trade) => ({
        ...trade,
        productCostFormatted: contractService.formatUSDT(trade.productCost),
        escrowFeeFormatted: contractService.formatUSDT(trade.escrowFee),
        logisticsCostsFormatted: trade.logisticsCosts.map((cost) =>
          contractService.formatUSDT(cost),
        ),
        totalQuantity: trade.totalQuantity.toString(),
        remainingQuantity: trade.remainingQuantity.toString(),
        purchaseIds: trade.purchaseIds.map((id) => id.toString()),
      }));

      res.status(200).json({
        status: 'success',
        data: formattedTrades,
      });
    } catch (error) {
      console.error('Error in getSellerTrades controller:', error);
      next(error);
    }
  }

  static async getProviderTrades(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const purchases = await contractService.getProviderTrades();

      // Format the purchases for better readability
      const formattedPurchases = purchases.map((purchase) => ({
        ...purchase,
        purchaseId: purchase.purchaseId.toString(),
        tradeId: purchase.tradeId.toString(),
        quantity: purchase.quantity.toString(),
        totalAmountFormatted: contractService.formatUSDT(purchase.totalAmount),
        logisticsCostFormatted: contractService.formatUSDT(
          purchase.logisticsCost,
        ),
      }));

      res.status(200).json({
        status: 'success',
        data: formattedPurchases,
      });
    } catch (error) {
      console.error('Error in getProviderTrades controller:', error);
      next(error);
    }
  }

  static async withdrawEscrowFees(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const hash = await contractService.withdrawEscrowFees();
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Escrow fees withdrawal transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in withdrawEscrowFees controller:', error);
      next(error);
    }
  }

  // Registration endpoints
  static async registerBuyer(req: Request, res: Response, next: NextFunction) {
    try {
      const hash = await contractService.registerBuyer();
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Buyer registration transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in registerBuyer controller:', error);
      next(error);
    }
  }

  static async registerSeller(req: Request, res: Response, next: NextFunction) {
    try {
      const hash = await contractService.registerSeller();
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Seller registration transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
        },
      });
    } catch (error) {
      console.error('Error in registerSeller controller:', error);
      next(error);
    }
  }

  // USDT utility endpoints
  static async getUSDTBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address } = req.params;

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return next(new CustomError('Valid address is required', 400, 'fail'));
      }

      const balance = await contractService.getUSDTBalance(address as `0x${string}`);

      res.status(200).json({
        status: 'success',
        data: {
          address,
          balance: balance.toString(),
          balanceFormatted: contractService.formatUSDT(balance),
        },
      });
    } catch (error) {
      console.error('Error in getUSDTBalance controller:', error);
      next(error);
    }
  }

   // Enhanced balance checking endpoint
  //  static async checkAccountBalances(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { address } = req.params;
      
  //     // Use provided address or default to service account
  //     const targetAddress = address ? address as `0x${string}` : undefined;
      
  //     if (address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
  //       return next(new CustomError('Valid address is required', 400, 'fail'));
  //     }

  //     const balances = await contractService.checkBalances(targetAddress);

  //     res.status(200).json({
  //       status: 'success',
  //       data: {
  //         address: targetAddress || contractService.getAccountAddress(),
  //         ...balances,
  //         recommendations: balances.hasEnoughForGas 
  //           ? 'Account has sufficient balance for transactions'
  //           : 'Please add more CELO to your account for gas fees'
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Error in checkAccountBalances controller:', error);
  //     next(error);
  //   }
  // }


  static async approveUSDT(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return next(new CustomError('Valid amount is required', 400, 'fail'));
      }

      const hash = await contractService.approveUSDT(
        contractService.parseUSDT(amount.toString()),
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'USDT approval transaction sent',
        data: {
          transactionHash: hash,
          amount: amount.toString(),
          receipt: serializeBigInt(receipt)
        },
      });
    } catch (error) {
      console.error('Error in approveUSDT controller:', error);
      next(error);
    }
  }
}
