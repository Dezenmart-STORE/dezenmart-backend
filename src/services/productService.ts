import { Product, IProduct } from '../models/productModel';

export class ProductService {
  static async createProduct(productData: Partial<IProduct>) {
    const product = new Product(productData);
    return await product.save();
  }

  static async getProducts() {
    return await Product.find();
  }

  static async getProductById(id: string) {
    return await Product.findById(id);
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
}
