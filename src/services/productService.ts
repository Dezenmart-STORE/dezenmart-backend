import { Address } from 'viem';
import { CustomError } from '../middlewares/errorHandler';
import { Product, IProduct } from '../models/productModel';
import { contractService } from '../server';
import { DezenMartContractAPIService } from './contractService';
import {
  CHAINENUMS,
  PaymentTokenSymbol,
} from './chainsContracts/contractService';

interface ICreateProductInput {
  name: string;
  description: string;
  price: number;
  chain?: CHAINENUMS;
  type: Record<string, string | number>[];
  category: string;
  seller: string;
  sellerWalletAddress: string;
  stock: number;
  images: string[];
  logisticsCost: string[];
  isSponsored: boolean;
  isActive: boolean;
  logisticsProviders: string[];
  useUSDT: boolean;
  paymentToken: PaymentTokenSymbol;
}

// let dezenMartContractAPIService = new DezenMartContractAPIService()

export class ProductService {
  static async createProduct(
    productInput: ICreateProductInput,
  ): Promise<IProduct> {
    const {
      price,
      stock,
      chain,
      logisticsProviders,
      logisticsCost,
      useUSDT,
      paymentToken,
      sellerWalletAddress,
    } = productInput;

    // Validate essential numeric and boolean fields
    if (typeof price !== 'number' || price <= 0) {
      throw new CustomError('Price must be a positive number.', 400, 'fail');
    }
    if (typeof stock !== 'number' || stock <= 0) {
      throw new CustomError('Stock must be a positive number.', 400, 'fail');
    }
    if (typeof useUSDT === 'undefined') {
      throw new CustomError(
        'The useUSDT field (boolean) is required.',
        400,
        'fail',
      );
    }

    // Validate logisticsProviders
    // if (
    //   !logisticsProviders ||
    //   !Array.isArray(logisticsProviders) ||
    //   !logisticsProviders.every(
    //     (lp) => typeof lp === 'string' && lp.startsWith('0x'),
    //   )
    // ) {
    //   throw new CustomError(
    //     'logisticsProviders must be an array of strings, each representing a valid wallet address (starting with "0x").',
    //     400,
    //     'fail',
    //   );
    // }

    // Validate logisticsCost
    if (
      !logisticsCost ||
      !Array.isArray(logisticsCost) ||
      !logisticsCost.every(
        (cost) =>
          typeof cost === 'string' &&
          !isNaN(parseFloat(cost)) &&
          isFinite(Number(cost)),
      )
    ) {
      throw new CustomError(
        'logisticsCost must be an array of strings, each representing a valid number.',
        400,
        'fail',
      );
    }

    if (logisticsProviders.length !== logisticsCost.length) {
      throw new CustomError(
        'logisticsProviders and logisticsCost arrays must have the same length.',
        400,
        'fail',
      );
    }

    // Validate paymentToken against the list of supported tokens in contractService
    // if (!paymentToken || !contractService.isValidPaymentToken(paymentToken)) {
    //   throw new CustomError(
    //     `Invalid or missing paymentToken. Supported tokens are: ${Object.keys(contractService.getPaymentTokens()).join(', ')}`,
    //     400,
    //     'fail',
    //   );
    // }

    const productCostStr = price.toString();

    // Get the actual token address from the symbol

    // const tradeReceipt = await contractService.createTrade(
    //   {
    //   sellerWalletAddress: sellerWalletAddress as Address,
    //   productCostInToken: productCostStr,
    //   //  logisticsProviders:   productInput.logisticsProviders as `0x${string}`[],
    //   logisticsProviders: productInput.logisticsProviders as any[],
    //   logisticsCostsInToken: productInput.logisticsCost,
    //   totalQuantity: BigInt(stock),
    //   tokenAddress:  tokenAddress,
    //   paymentToken,
    //   chain: chain as CHAINENUMS,
    // });

    const tradeReceipt = await DezenMartContractAPIService.createTrade(
    productInput);

    // let tradeId;
   
   let  tradeId = tradeReceipt.tradeId.toString();

    if (!tradeId) {
      console.error(
        'Failed to extract tradeId. Full receipt:',
        JSON.stringify(tradeReceipt, null, 2),
      );
      throw new CustomError(
        'Trade created on blockchain, but failed to retrieve tradeId from events. Product not saved.',
        500,
        'error',
      );
    }

    // 2. Create the product in the database with the tradeId
    const productToSave = new Product({
      ...productInput,
      productToken: productInput.paymentToken,
      tradeId: tradeId,
      chain:tradeReceipt?.chain,
      tokenMint:tradeReceipt?.tokenMint
    });

    return await productToSave.save();
  }

  static async getProducts() {
    return await Product.find().populate('seller', 'name profileImage rating');
  }

  static async getProductById(id: string) {
    return await Product.findById(id).populate(
      'seller',
      'name profileImage rating',
    );
  }

  static async updateProduct(id: string, productData: Partial<IProduct>) {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  }

  static async deleteProduct(id: string) {
    return await Product.findByIdAndDelete(id);
  }

  // static async getProductsByCategory(category: string, page = 1, limit = 10) {
  //   const skip = (page - 1) * limit;
  //   return await Product.find({ category, isActive: true })
  //     .skip(skip)
  //     .limit(limit)
  //     .populate('seller', 'name profileImage rating');
  // }

  static async getSponsoredProducts() {
    return await Product.find({ isSponsored: true, isActive: true })
      .limit(4)
      .populate('seller', 'name profileImage rating');
  }

  static async searchProducts(query: string, filters: any) {
    const searchQuery: any = {
      $and: [{ isActive: true }, { $text: { $search: query } }],
    };

    if (filters.category) {
      searchQuery.$and.push({ category: filters.category });
    }

    if (filters.minPrice || filters.maxPrice) {
      const priceFilter: any = {};
      if (filters.minPrice) priceFilter.$gte = Number(filters.minPrice);
      if (filters.maxPrice) priceFilter.$lte = Number(filters.maxPrice);
      searchQuery.$and.push({ price: priceFilter });
    }

    return await Product.find(searchQuery).populate(
      'seller',
      'name profileImage rating',
    );
  }

  static async getProductsBySeller(sellerId: string) {
    return await Product.find({ seller: sellerId }).populate(
      'seller',
      'name profileImage rating',
    );
  }
}
