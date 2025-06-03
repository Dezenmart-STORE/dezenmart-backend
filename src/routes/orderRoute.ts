import express from 'express';
import { OrderController } from '../controllers/orderController';
import { OrderValidation } from '../utils/validations/orderValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(OrderValidation.create),
  OrderController.createOrder,
);
router.get('/:id', authenticate, OrderController.getOrderDetails);
router.put(
  '/:id',
  authenticate,
  // validate(OrderValidation.updateStatus),
  OrderController.updateOrder,
);
router.get(
  '/',
  authenticate,
  validate(OrderValidation.getUserOrders),
  OrderController.getUserOrders,
);
router.post(
  '/:id/dispute',
  authenticate,
  validate(OrderValidation.dispute),
  OrderController.raiseDispute,
);

export default router;
