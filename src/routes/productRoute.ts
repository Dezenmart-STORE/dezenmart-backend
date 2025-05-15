import express from 'express';
import { ProductController } from '../controllers/productController';
import { ProductValidation } from '../utils/validations/productValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadMultipleImages } from '../middlewares/uploadMiddleware';
import transformProductFormData from '../middlewares/transformFormData';

const router = express.Router();

router.post(
  '/',
  authenticate,
  uploadMultipleImages('images', 5),
  transformProductFormData,
  // validate(ProductValidation.create),
  ProductController.createProduct,
);
router.get('/', ProductController.getProducts);
// router.get(
//   '/category/:category',
//   validate(ProductValidation.byCategory),
//   ProductController.getProductsByCategory,
// );
router.get(
  '/search',
  validate(ProductValidation.search),
  ProductController.searchProducts,
);
router.get('/sponsored', ProductController.getSponsoredProducts);
router.get('/:id', ProductController.getProductDetails);
router.put(
  '/:id',
  authenticate,
  uploadMultipleImages('images', 5),
  validate(ProductValidation.update),
  ProductController.updateProduct,
);
router.delete('/:id', authenticate, ProductController.deleteProduct);

export default router;
