import express from 'express';
import { QuidaxController } from '../controllers/quidaxController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../utils/validation';
import { QuidaxValidation } from '../utils/validations/quidaxValidation';

const router = express.Router();

// ── On-Ramp ────────────────────────────────────────────────────────────────

router.post(
  '/on-ramp/initiate',
  authenticate,
  validate(QuidaxValidation.initiateOnRamp),
  QuidaxController.initiateOnRamp,
);

router.post('/on-ramp/:merchantRef/confirm', authenticate, QuidaxController.confirmOnRamp);

router.put(
  '/on-ramp/:merchantRef/refresh',
  authenticate,
  validate(QuidaxValidation.refreshOnRamp),
  QuidaxController.refreshOnRamp,
);

router.get('/on-ramp/:merchantRef', authenticate, QuidaxController.fetchOnRampTransaction);

// ── Off-Ramp ───────────────────────────────────────────────────────────────

router.post(
  '/off-ramp/initiate',
  authenticate,
  validate(QuidaxValidation.initiateOffRamp),
  QuidaxController.initiateOffRamp,
);

router.post('/off-ramp/:merchantRef/confirm', authenticate, QuidaxController.confirmOffRamp);

router.post(
  '/off-ramp/:merchantRef/bank-account',
  authenticate,
  validate(QuidaxValidation.addBankAccount),
  QuidaxController.addBankAccount,
);

router.get('/off-ramp/:merchantRef', authenticate, QuidaxController.fetchOffRampTransaction);

// ── Banks ──────────────────────────────────────────────────────────────────

router.get('/banks', authenticate, QuidaxController.getBanks);

// ── Webhook (public — Quidax calls this) ───────────────────────────────────

router.post('/webhook', QuidaxController.handleWebhook);

export default router;
