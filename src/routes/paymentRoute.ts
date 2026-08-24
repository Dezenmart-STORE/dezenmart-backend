import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { PaymentValidation } from '../utils/validations/paymentValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/banks', authenticate, validate(PaymentValidation.getBanks), PaymentController.getBanks);

router.post(
  '/resolve-account',
  authenticate,
  validate(PaymentValidation.resolveAccount),
  PaymentController.resolveAccount,
);

router.get('/fiat-account', authenticate, PaymentController.getFiatAccount);
router.post(
  '/fiat-account',
  authenticate,
  validate(PaymentValidation.setFiatAccount),
  PaymentController.setFiatAccount,
);

// ── Webhooks (public — the gateways call these) ────────────────────────────
router.post('/webhook/paystack', PaymentController.handlePaystackWebhook);
router.post('/webhook/flutterwave', PaymentController.handleFlutterwaveWebhook);

export default router;
