import express from 'express';
import { DeliveryController } from '../controllers/deliveryController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../utils/validation';
import { DeliveryValidation } from '../utils/validations/deliveryValidation';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(DeliveryValidation.create),
  DeliveryController.create,
);
router.get(
  '/',
  authenticate,
  validate(DeliveryValidation.list),
  DeliveryController.list,
);
router.get(
  '/:id',
  authenticate,
  validate(DeliveryValidation.getById),
  DeliveryController.getById,
);
router.put(
  '/:id',
  authenticate,
  validate(DeliveryValidation.update),
  DeliveryController.update,
);
router.delete(
  '/:id',
  authenticate,
  validate(DeliveryValidation.delete),
  DeliveryController.delete,
);

export default router;
