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

router.post(
  '/admin/withdraw-eth',
  authenticate,
  //   adminMiddleware,
  ContractController.withdrawEscrowFeesETH,
);

router.post(
  '/admin/withdraw-usdt',
  authenticate,
  //   adminMiddleware,
  ContractController.withdrawEscrowFeesUSDT,
);

// --- Trade Creation and Management ---
router.post('/trades', authenticate, ContractController.createTrade);

router.post('/trades/:tradeId/buy', authenticate, ContractController.buyTrade);

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

// --- Read Routes ---
router.get(
  '/trades/:tradeId',
  authenticate,
  ContractController.getTradeDetails,
);

router.get(
  '/trades/buyer/list',
  authenticate,
  ContractController.getTradesByBuyer,
);

router.get(
  '/trades/seller/list',
  authenticate,
  ContractController.getTradesBySeller,
);

export default router;
