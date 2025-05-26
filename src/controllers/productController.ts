import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { CustomError } from '../middlewares/errorHandler';

export class ProductController {
  static createProduct = async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    let imageUrls: string[] = [];

    if (files && files.length > 0) {
      imageUrls = files.map((file) => file.path);
    }

    if (imageUrls.length === 0) {
      throw new CustomError('No images provided', 400, 'fail');
    }

    if (imageUrls.length > 5) {
      throw new CustomError('You can only upload a maximum of 5 images', 400, 'fail');
    }

    const {
      name,
      description,
      price,
      type,
      category,
      sellerWalletAddress,
      stock,
      logisticsProviders,
      logisticsCosts,
      useUSDT,
      isSponsored
    } = req.body;
 
    const parseArrayField = (fieldValue: any): string[] => {
      if (fieldValue === undefined || fieldValue === null) {
        return [];
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.map(String);
      }
      if (typeof fieldValue === 'string') {
        try {
          const parsed = JSON.parse(fieldValue);
          if (Array.isArray(parsed)) {
            return parsed.map(String);
          } else {
            return [String(parsed)];
          }
        } catch (e) {
          if (fieldValue.includes(',')) {
            return fieldValue.split(',').map(s => String(s.trim()));
          } else {
            if (fieldValue.trim() === '') return [];
            return [String(fieldValue)];
          }
        }
      }
      // For other types like number, convert to string and wrap in array
      return [String(fieldValue)];
    };

    const finalLogisticsCosts = parseArrayField(logisticsCosts);
    const finalLogisticsProviders = parseArrayField(logisticsProviders);

    // Validate required fields after parsing
    if (!name) throw new CustomError('Product name is required', 400, 'fail');
    if (price === undefined || price === null || isNaN(Number(price))) throw new CustomError('Valid product price is required', 400, 'fail');
    if (stock === undefined || stock === null || isNaN(Number(stock))) throw new CustomError('Valid product stock is required', 400, 'fail');
    if (!category) throw new CustomError('Product category is required', 400, 'fail');
    if (!sellerWalletAddress) throw new CustomError('Seller wallet address is required', 400, 'fail');
    if (finalLogisticsProviders.length === 0 && finalLogisticsCosts.length > 0) {
        throw new CustomError('Logistics providers are required if logistics costs are specified.', 400, 'fail');
    }
    if (finalLogisticsProviders.length > 0 && finalLogisticsCosts.length === 0) {
        throw new CustomError('Logistics costs are required if logistics providers are specified.', 400, 'fail');
    }
    if (finalLogisticsProviders.length !== finalLogisticsCosts.length) {
        throw new CustomError('Logistics providers and costs must have the same number of entries.', 400, 'fail');
    }

    const productInput = {
      name,
      description,
      price: Number(price),
      type,
      category,
      seller: req.user.id,
      sellerWalletAddress,
      stock: Number(stock),
      images: imageUrls,
      logisticsCost: logisticsCosts,
      isSponsored: Boolean(isSponsored || false),
      logisticsProviders: finalLogisticsProviders,
      useUSDT: Boolean(useUSDT || false),
    };
    const product = await ProductService.createProduct(productInput as any);
    res.status(201).json({
      message: 'Product and associated trade created successfully',
      data: product,
    });
  };

  static getProducts = async (req: Request, res: Response) => {
    const products = await ProductService.getProducts();
    res.json(products);
  };

  static getProductDetails = async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json(product);
  };

  static updateProduct = async (req: Request, res: Response) => {
    const productId = req.params.id;

    const files = req.files as Express.Multer.File[];
    let imageUrls: string[] = [];

    const updateData = { ...req.body };

    if (files && files.length > 0) {
      imageUrls = files.map((file) => file.path);
      updateData.images = imageUrls;
    }

    const product = await ProductService.updateProduct(productId, updateData);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json(product);
  };

  static deleteProduct = async (req: Request, res: Response) => {
    const product = await ProductService.deleteProduct(req.params.id);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json({ message: 'Product deleted successfully' });
  };

  // static getProductsByCategory = async (req: Request, res: Response) => {
  //   const page = parseInt(req.query.page as string) || 1;
  //   const limit = parseInt(req.query.limit as string) || 10;
  //   const products = await ProductService.getProductsByCategory(
  //     req.params.category,
  //     page,
  //     limit,
  //   );
  //   res.json(products);
  // };

  static getSponsoredProducts = async (req: Request, res: Response) => {
    const products = await ProductService.getSponsoredProducts();
    res.json(products);
  };

  static searchProducts = async (req: Request, res: Response) => {
    const { q, ...filters } = req.query;
    const products = await ProductService.searchProducts(q as string, filters);
    res.json(products);
  };
}
