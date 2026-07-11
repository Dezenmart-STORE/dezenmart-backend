import express from 'express';
import { OrderController } from '../controllers/orderController';
import { OrderValidation } from '../utils/validations/orderValidation';
import { validate } from '../utils/validation';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '../models/userModel';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(OrderValidation.create),
  OrderController.createOrder,
);

router.get('/', authenticate, OrderController.getOrders);

router.get(
  '/logistics/me',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(OrderValidation.getLogisticsOrders),
  OrderController.getLogisticsOrders,
);

router.patch(
  '/logistics/me/:orderId/accept',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(OrderValidation.acceptLogisticsOrder),
  OrderController.acceptLogisticsOrder,
);

router.patch(
  '/logistics/me/:orderId/reject',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(OrderValidation.rejectLogisticsOrder),
  OrderController.rejectLogisticsOrder,
);

router.patch(
  '/logistics/me/:orderId/ship',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(OrderValidation.shipOrder),
  OrderController.shipOrder,
);

router.get('/:id', authenticate, OrderController.getOrderDetails);

router.put('/:id', authenticate, OrderController.updateOrder);

router.post(
  '/:id/dispute',
  authenticate,
  validate(OrderValidation.dispute),
  OrderController.raiseDispute,
);

export default router;
