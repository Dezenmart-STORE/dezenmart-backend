import express from 'express';
import { RiderController } from '../controllers/riderController';
import { RiderBookingController } from '../controllers/riderBookingController';
import { RiderWalletController } from '../controllers/riderWalletController';
import { authenticateRider, requireVerifiedRider } from '../middlewares/riderAuthMiddleware';
import { validate } from '../utils/validation';
import { RiderValidation } from '../utils/validations/riderValidation';
import { RiderBookingValidation } from '../utils/validations/riderBookingValidation';

const router = express.Router();

// ── Registration / Auth ──────────────────────────────────────────────────

router.post('/register', validate(RiderValidation.register), RiderController.register);
router.post('/auth/login', validate(RiderValidation.login), RiderController.login);
router.post('/auth/verify-otp', validate(RiderValidation.verifyOtp), RiderController.verifyOtp);

// ── Rider actions (authenticated) ────────────────────────────────────────

router.get(
  '/requests',
  authenticateRider,
  requireVerifiedRider,
  RiderBookingController.getRequests,
);

router.patch(
  '/requests/:id/accept',
  authenticateRider,
  requireVerifiedRider,
  validate(RiderBookingValidation.idParam),
  RiderBookingController.accept,
);

router.patch(
  '/requests/:id/reject',
  authenticateRider,
  requireVerifiedRider,
  validate(RiderBookingValidation.idParam),
  RiderBookingController.reject,
);

router.patch(
  '/bookings/:id/status',
  authenticateRider,
  requireVerifiedRider,
  validate(RiderBookingValidation.updateStatus),
  RiderBookingController.updateStatus,
);

router.patch(
  '/bookings/:id/verify-otp',
  authenticateRider,
  requireVerifiedRider,
  validate(RiderBookingValidation.verifyOtp),
  RiderBookingController.verifyOtp,
);

// ── Rider wallet / earnings (authenticated) ──────────────────────────────

router.get('/wallet', authenticateRider, RiderWalletController.getWallet);
router.get('/transactions', authenticateRider, RiderWalletController.getTransactions);
router.post(
  '/withdraw',
  authenticateRider,
  validate(RiderValidation.withdraw),
  RiderWalletController.withdraw,
);

export default router;
