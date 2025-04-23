import express from 'express';
import { ReviewController } from '../controllers/reviewController';
import { ReviewValidation } from '../utils/validations/reviewValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';
import { runInContext } from 'vm';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(ReviewValidation.create),
  ReviewController.createReview,
);
router.put(
  '/user-rating/:userId',
  authenticate,
  validate(ReviewValidation.updateUserRating),
  ReviewController.updateUserRating,
);
router.get(
  '/user/:userId',
  authenticate,
  validate(ReviewValidation.getUserReviews),
  ReviewController.getUserReviews,
);
router.get(
  '/order/:orderId',
  authenticate,
  validate(ReviewValidation.getOrderReview),
  ReviewController.getOrderReview,
);

export default router;
