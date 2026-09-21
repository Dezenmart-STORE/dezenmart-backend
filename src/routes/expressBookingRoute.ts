import express from 'express';
import { BookingController } from '../controllers/bookingController';
import { validate } from '../utils/validation';
import { BookingValidation } from '../utils/validations/bookingValidation';

const router = express.Router();

router.post('/rides/book', validate(BookingValidation.bookRide), BookingController.bookRide);
router.post(
  '/deliveries/book',
  validate(BookingValidation.bookDelivery),
  BookingController.bookDelivery,
);

router.get('/orders', validate(BookingValidation.lookupOrders), BookingController.findOrders);
router.get(
  '/orders/:bookingRef',
  validate(BookingValidation.bookingRefParam),
  BookingController.getByBookingRef,
);
router.get(
  '/orders/:bookingRef/status',
  validate(BookingValidation.bookingRefParam),
  BookingController.getStatus,
);
router.patch(
  '/orders/:bookingRef/cancel',
  validate(BookingValidation.cancel),
  BookingController.cancel,
);

export default router;
