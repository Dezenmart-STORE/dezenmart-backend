import express from 'express';
import { ProductController } from '../controllers/productController';
import { ProductValidation } from '../utils/validations/productValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(ProductValidation.create),
  ProductController.createProduct,
);
router.get(
  '/category/:category',
  validate(ProductValidation.byCategory),
  ProductController.getProductsByCategory,
);
router.get(
  '/search',
  validate(ProductValidation.search),
  ProductController.searchProducts,
);
router.get('/:id', ProductController.getProductDetails);
router.put(
  '/:id',
  authenticate,
  validate(ProductValidation.update),
  ProductController.updateProduct,
);
router.delete('/:id', authenticate, ProductController.deleteProduct);

export default router;
