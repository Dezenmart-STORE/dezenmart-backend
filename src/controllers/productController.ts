import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { CustomError } from '../middlewares/errorHandler';

export class ProductController {
  static createProduct = async (req: Request, res: Response) => {
    const productData = {
      ...req.body,
      seller: req.user.id,
    };
    const product = await ProductService.createProduct(productData);
    res.status(201).json(product);
  };

  static getProductDetails = async (req: Request, res: Response) => {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json(product);
  };

  static updateProduct = async (req: Request, res: Response) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json(product);
  };

  static deleteProduct = async (req: Request, res: Response) => {
    const product = await ProductService.deleteProduct(req.params.id);
    if (!product) throw new CustomError('Product not found', 404, 'fail');
    res.json({ message: 'Product deleted successfully' });
  };

  static getProductsByCategory = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await ProductService.getProductsByCategory(
      req.params.category,
      page,
      limit,
    );
    res.json(products);
  };

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
