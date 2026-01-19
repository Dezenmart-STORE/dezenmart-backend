import { Request, Response, NextFunction } from 'express';
import { contractService } from '../server';
import { CustomError } from '../middlewares/errorHandler';
import { Address } from 'viem';

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
  // Helper method to validate Ethereum addresses
  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Helper method to validate and parse positive numbers
  private static validatePositiveNumber(value: any, fieldName: string): number {
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      throw new CustomError(`Valid ${fieldName} is required`, 400, 'fail');
    }
    return Number(value);
  }

  // Helper method to validate and parse positive integers
  private static validatePositiveInteger(
    value: any,
    fieldName: string,
  ): number {
    const num = parseInt(value, 10);
    if (!value || isNaN(num) || num < 0) {
      throw new CustomError(`Valid ${fieldName} is required`, 400, 'fail');
    }
    return num;
  }

  static async registerLogisticsProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { providerAddress } = req.body;

      if (
        !providerAddress ||
        !ContractController.isValidAddress(providerAddress)
      ) {
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
          receipt: serializeBigInt(receipt),
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

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      if (!winner || !ContractController.isValidAddress(winner)) {
        return next(
          new CustomError('Valid winner address is required', 400, 'fail'),
        );
      }

      const hash = await contractService.resolveDispute(
        BigInt(purchaseIdNum),
        winner,
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Dispute resolution transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
        },
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
        totalQuantity,
        tokenAddress,
        sellerWalletAddress,
      } = req.body;

      // Validate product cost
      const productCostNum = ContractController.validatePositiveNumber(
        productCost,
        'product cost',
      );

      // Validate token address
      if (!tokenAddress || !ContractController.isValidAddress(tokenAddress)) {
        return next(
          new CustomError('Valid token address is required', 400, 'fail'),
        );
      }

      // Validate seller wallet address
      if (
        !sellerWalletAddress ||
        !ContractController.isValidAddress(sellerWalletAddress)
      ) {
        return next(
          new CustomError('Valid seller wallet address is required', 400, 'fail'),
        );
      }

      // Validate if it's a supported token (optional - depends on your business logic)
      // You can uncomment this if you want to restrict to predefined tokens
      // if (!contractService.isValidPaymentToken(tokenAddress)) {
      //   return next(
      //     new CustomError('Unsupported payment token', 400, 'fail'),
      //   );
      // }

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
        if (!ContractController.isValidAddress(provider)) {
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
      const validatedCosts: number[] = [];
      for (const cost of logisticsCosts) {
        validatedCosts.push(
          ContractController.validatePositiveNumber(cost, 'logistics cost'),
        );
      }

      // Validate total quantity
      const totalQuantityNum = ContractController.validatePositiveNumber(
        totalQuantity,
        'total quantity',
      );

      // Create the trade
      const { hash, tradeId } = await contractService.createTrade(
        sellerWalletAddress as Address, // Pass the seller address from the request context
        productCostNum.toString(),
        BigInt(totalQuantityNum),
        tokenAddress as Address,
      );

      res.status(201).json({
        status: 'success',
        message: 'Trade created successfully',
        data: {
          transactionHash: hash,
          tradeId: tradeId.toString(),
          tokenAddress,
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
      const { quantity, logisticsProvider, tokenAddress } = req.body;

      // Validate tradeId
      const tradeIdNum = ContractController.validatePositiveInteger(
        tradeId,
        'Trade ID',
      );

      // Validate quantity
      const quantityNum = ContractController.validatePositiveNumber(
        quantity,
        'quantity',
      );

      // Validate logistics provider
      if (
        !logisticsProvider ||
        !ContractController.isValidAddress(logisticsProvider)
      ) {
        return next(
          new CustomError(
            'Valid logistics provider address is required',
            400,
            'fail',
          ),
        );
      }

      // Get trade to verify it exists and is active
      const trade = await contractService.getTrade(tradeIdNum);
      if (!trade || !trade.active) {
        return next(
          new CustomError('Trade not found or inactive', 404, 'fail'),
        );
      }

      // Verify the logistics provider is valid for this trade
      const providerExists = trade.logisticsProviders.some(
        (provider) =>
          provider.toLowerCase() === logisticsProvider.toLowerCase(),
      );
      if (!providerExists) {
        return next(
          new CustomError(
            'Invalid logistics provider for this trade',
            400,
            'fail',
          ),
        );
      }

      // Buy the trade
      const { hash, purchaseId } = await contractService.buyTrade(
        tradeIdNum,
        BigInt(quantityNum),
        logisticsProvider,
        tokenAddress as Address,
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

  static async confirmDeliveryAndPurchase(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { purchaseId } = req.params;

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      const hash = await contractService.confirmDeliveryAndPurchase(
        purchaseIdNum.toString(),
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Delivery confirmation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
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

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      const hash = await contractService.confirmPurchase(
        purchaseIdNum.toString(),
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Purchase confirmation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
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

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      const hash = await contractService.cancelPurchase(BigInt(purchaseIdNum));
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Purchase cancellation transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
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

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      const hash = await contractService.raiseDispute(BigInt(purchaseIdNum));
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Dispute raising transaction sent',
        data: {
          transactionHash: hash,
          receipt: serializeBigInt(receipt),
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

      const tradeIdNum = ContractController.validatePositiveInteger(
        tradeId,
        'Trade ID',
      );

      const tradeDetails = await contractService.getTrade(tradeIdNum);

      // Note: You'll need to modify your contract to return token address info
      // or store it separately. For now, we'll format using a default token
      // This is a limitation that needs to be addressed in your contract design

      const formattedTrade = {
        seller: tradeDetails.seller,
        logisticsProviders: tradeDetails.logisticsProviders,
        logisticsCosts: tradeDetails.logisticsCosts.map((cost) =>
          cost.toString(),
        ),
        productCost: tradeDetails.productCost.toString(),
        escrowFee: tradeDetails.escrowFee.toString(),
        totalQuantity: tradeDetails.totalQuantity.toString(),
        remainingQuantity: tradeDetails.remainingQuantity.toString(),
        active: tradeDetails.active,
        purchaseIds: tradeDetails.purchaseIds.map((id) => id.toString()),
        // Add formatted versions for common tokens
        // You may want to add tokenAddress field to your Trade struct
        productCostFormattedUSDT: contractService.formatUSDT(
          tradeDetails.productCost,
        ),
        escrowFeeFormattedUSDT: contractService.formatUSDT(
          tradeDetails.escrowFee,
        ),
        logisticsCostsFormattedUSDT: tradeDetails.logisticsCosts.map((cost) =>
          contractService.formatUSDT(cost),
        ),
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

      const purchaseIdNum = ContractController.validatePositiveInteger(
        purchaseId,
        'Purchase ID',
      );

      const purchaseDetails = await contractService.getPurchase(
        BigInt(purchaseIdNum),
      );

      const formattedPurchase = {
        purchaseId: purchaseDetails.purchaseId.toString(),
        tradeId: purchaseDetails.tradeId.toString(),
        buyer: purchaseDetails.buyer,
        quantity: purchaseDetails.quantity.toString(),
        totalAmount: purchaseDetails.totalAmount.toString(),
        delivered: purchaseDetails.delivered,
        confirmed: purchaseDetails.confirmed,
        disputed: purchaseDetails.disputed,
        chosenLogisticsProvider: purchaseDetails.chosenLogisticsProvider,
        logisticsCost: purchaseDetails.logisticsCost.toString(),
        // Add formatted versions
        totalAmountFormattedUSDT: contractService.formatUSDT(
          purchaseDetails.totalAmount,
        ),
        logisticsCostFormattedUSDT: contractService.formatUSDT(
          purchaseDetails.logisticsCost,
        ),
      };

      res.status(200).json({
        status: 'success',
        data: formattedPurchase,
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

      const formattedPurchases = purchases.map((purchase) => ({
        purchaseId: purchase.purchaseId.toString(),
        tradeId: purchase.tradeId.toString(),
        buyer: purchase.buyer,
        quantity: purchase.quantity.toString(),
        totalAmount: purchase.totalAmount.toString(),
        delivered: purchase.delivered,
        confirmed: purchase.confirmed,
        disputed: purchase.disputed,
        chosenLogisticsProvider: purchase.chosenLogisticsProvider,
        logisticsCost: purchase.logisticsCost.toString(),
        totalAmountFormattedUSDT: contractService.formatUSDT(
          purchase.totalAmount,
        ),
        logisticsCostFormattedUSDT: contractService.formatUSDT(
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

      const formattedTrades = trades.map((trade) => ({
        seller: trade.seller,
        logisticsProviders: trade.logisticsProviders,
        logisticsCosts: trade.logisticsCosts.map((cost) => cost.toString()),
        productCost: trade.productCost.toString(),
        escrowFee: trade.escrowFee.toString(),
        totalQuantity: trade.totalQuantity.toString(),
        remainingQuantity: trade.remainingQuantity.toString(),
        active: trade.active,
        purchaseIds: trade.purchaseIds.map((id) => id.toString()),
        productCostFormattedUSDT: contractService.formatUSDT(trade.productCost),
        escrowFeeFormattedUSDT: contractService.formatUSDT(trade.escrowFee),
        logisticsCostsFormattedUSDT: trade.logisticsCosts.map((cost) =>
          contractService.formatUSDT(cost),
        ),
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

      const formattedPurchases = purchases.map((purchase) => ({
        purchaseId: purchase.purchaseId.toString(),
        tradeId: purchase.tradeId.toString(),
        buyer: purchase.buyer,
        quantity: purchase.quantity.toString(),
        totalAmount: purchase.totalAmount.toString(),
        delivered: purchase.delivered,
        confirmed: purchase.confirmed,
        disputed: purchase.disputed,
        chosenLogisticsProvider: purchase.chosenLogisticsProvider,
        logisticsCost: purchase.logisticsCost.toString(),
        totalAmountFormattedUSDT: contractService.formatUSDT(
          purchase.totalAmount,
        ),
        logisticsCostFormattedUSDT: contractService.formatUSDT(
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
          receipt: serializeBigInt(receipt),
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
          receipt: serializeBigInt(receipt),
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

  // Token utility endpoints
  static async getTokenBalance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { tokenAddress: tokenAddressParam, userAddress: userAddressParam } =
        req.params;

      const tokenAddress = Array.isArray(tokenAddressParam)
        ? tokenAddressParam[0]
        : tokenAddressParam;
      const userAddress = Array.isArray(userAddressParam)
        ? userAddressParam[0]
        : userAddressParam;

      if (!tokenAddress || !ContractController.isValidAddress(tokenAddress)) {
        return next(
          new CustomError('Valid token address is required', 400, 'fail'),
        );
      }

      if (!userAddress || !ContractController.isValidAddress(userAddress)) {
        return next(
          new CustomError('Valid user address is required', 400, 'fail'),
        );
      }

      const balance = await contractService.getTokenBalance(
        tokenAddress as Address,
        userAddress as Address,
      );
      const decimals = await contractService.getTokenDecimals(
        tokenAddress as Address,
      );

      res.status(200).json({
        status: 'success',
        data: {
          tokenAddress,
          userAddress,
          balance: balance.toString(),
          balanceFormatted: contractService.formatToken(balance, decimals),
          decimals,
        },
      });
    } catch (error) {
      console.error('Error in getTokenBalance controller:', error);
      next(error);
    }
  }

  static async approveToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { tokenAddress: tokenAddressParam } = req.params;
      const { amount } = req.body;

      const tokenAddress = Array.isArray(tokenAddressParam)
        ? tokenAddressParam[0]
        : tokenAddressParam;

      if (!tokenAddress || !ContractController.isValidAddress(tokenAddress)) {
        return next(
          new CustomError('Valid token address is required', 400, 'fail'),
        );
      }

      const amountNum = ContractController.validatePositiveNumber(
        amount,
        'amount',
      );

      const decimals = await contractService.getTokenDecimals(
        tokenAddress as Address,
      );
      const amountBigInt = contractService.parseToken(
        amountNum.toString(),
        decimals,
      );

      const hash = await contractService.approveToken(
        tokenAddress as Address,
        amountBigInt,
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'Token approval transaction sent',
        data: {
          transactionHash: hash,
          tokenAddress,
          amount: amountNum.toString(),
          amountFormatted: contractService.formatToken(amountBigInt, decimals),
          receipt: serializeBigInt(receipt),
        },
      });
    } catch (error) {
      console.error('Error in approveToken controller:', error);
      next(error);
    }
  }

  static async getPaymentTokens(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const tokens = contractService.getPaymentTokens();

      res.status(200).json({
        status: 'success',
        data: {
          supportedTokens: tokens,
          count: Object.keys(tokens).length,
        },
      });
    } catch (error) {
      console.error('Error in getPaymentTokens controller:', error);
      next(error);
    }
  }

  // Legacy USDT endpoints (for backward compatibility)
  static async getUSDTBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { address: addressParam } = req.params;

      const address = Array.isArray(addressParam)
        ? addressParam[0]
        : addressParam;

      if (!address || !ContractController.isValidAddress(address)) {
        return next(new CustomError('Valid address is required', 400, 'fail'));
      }

      const balance = await contractService.getUSDTBalance(address as Address);

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

  static async approveUSDT(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;

      const amountNum = ContractController.validatePositiveNumber(
        amount,
        'amount',
      );

      const hash = await contractService.approveUSDT(
        contractService.parseUSDT(amountNum.toString()),
      );
      const receipt = await contractService.getTransactionReceipt(hash);

      res.status(200).json({
        status: 'success',
        message: 'USDT approval transaction sent',
        data: {
          transactionHash: hash,
          amount: amountNum.toString(),
          receipt: serializeBigInt(receipt),
        },
      });
    } catch (error) {
      console.error('Error in approveUSDT controller:', error);
      next(error);
    }
  }

  // Utility endpoint to get account info
  static async getAccountInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const accountAddress = contractService.getAccountAddress();

      if (!accountAddress) {
        return next(new CustomError('No account configured', 400, 'fail'));
      }

      res.status(200).json({
        status: 'success',
        data: {
          accountAddress,
          supportedTokens: contractService.getPaymentTokens(),
        },
      });
    } catch (error) {
      console.error('Error in getAccountInfo controller:', error);
      next(error);
    }
  }
}
