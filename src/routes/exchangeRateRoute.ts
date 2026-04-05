import { Router } from 'express';
import { ExchangeRateController } from '../controllers/exchangeRateController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '../models/userModel';

const router = Router();

// Endpoint for admin to set the exchange rate
router.post(
  '/',
  authenticate,
  authorizeRoles(Role.ADMIN),
  ExchangeRateController.setRate
);

// Endpoint for fetching the exchange rate (public)
router.get('/', ExchangeRateController.getRate);

// Endpoint for updating a user's token balance (admin only based on request)
router.patch(
  '/users/:userId/tokens',
  authenticate,
  authorizeRoles(Role.ADMIN),
  ExchangeRateController.updateUserTokens
);

// Endpoint for a user to purchase tokens based on the current rate
router.post(
  '/purchase',
  authenticate,
  ExchangeRateController.purchaseTokens
);

// Endpoint for a user to spend their tokens
router.post(
  '/spend',
  authenticate,
  ExchangeRateController.spendTokens
);

export default router;
