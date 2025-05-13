import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { CustomError } from '../middlewares/errorHandler';

export class ProductController {
  static createProduct = async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageFilenames: string[] = [];

    if (files && files.length > 0) {
      files.forEach((file) => imageFilenames.push(file.filename));
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
 

    const productInput = {
      name,
      description,
      price: Number(price),
      type,
      category,
      seller: req.user.id,
      sellerWalletAddress,
      stock: Number(stock),
      images: imageFilenames,
      logisticsCost: logisticsCosts,
      isSponsored: Boolean(isSponsored || false),
      logisticsProviders,
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
    let imageFilenames: string[] = [];

    const updateData = { ...req.body };

    if (files && files.length > 0) {
      imageFilenames = files.map((file) => file.filename);
      updateData.images = imageFilenames;
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
