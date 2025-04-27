import express from 'express';
import { ContractController } from '../controllers/contractController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// --- Admin Routes ---
router.post(
  '/admin/register-logistics',
  authenticate,
  //   adminMiddleware,
  ContractController.registerLogisticsProvider,
);
router.post(
  '/admin/resolve-dispute/:tradeId',
  authenticate,
  //   adminMiddleware,
  ContractController.resolveDispute,
);
router.post('/trades', authenticate, ContractController.createTrade);
router.post(
  '/trades/:tradeId/confirm-delivery',
  authenticate,
  ContractController.confirmDelivery,
);
router.post(
  '/trades/:tradeId/cancel',
  authenticate,
  ContractController.cancelTrade,
);
router.post(
  '/trades/:tradeId/dispute',
  authenticate,
  ContractController.raiseDispute,
);

// --- Read Route ---
router.get(
  '/trades/:tradeId',
  authenticate,
  ContractController.getTradeDetails,
);

export default router;
