import express from 'express';
import { DeliveryAddressController } from '../controllers/deliveryAddressController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../utils/validation';
import { DeliveryAddressValidation } from '../utils/validations/deliveryAddressValidation';

const router = express.Router();

router.post(
  '/',
  authenticate,
  validate(DeliveryAddressValidation.create),
  DeliveryAddressController.create,
);
router.get(
  '/',
  authenticate,
  validate(DeliveryAddressValidation.list),
  DeliveryAddressController.list,
);
router.get(
  '/:id',
  authenticate,
  validate(DeliveryAddressValidation.getById),
  DeliveryAddressController.getById,
);
router.put(
  '/:id',
  authenticate,
  validate(DeliveryAddressValidation.update),
  DeliveryAddressController.update,
);
router.patch(
  '/:id/default',
  authenticate,
  validate(DeliveryAddressValidation.getById),
  DeliveryAddressController.setDefault,
);
router.delete(
  '/:id',
  authenticate,
  validate(DeliveryAddressValidation.delete),
  DeliveryAddressController.delete,
);

export default router;
