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
  '/admin/resolve-dispute/:purchaseId', // Changed from tradeId to purchaseId
  authenticate,
  //   adminMiddleware,
  ContractController.resolveDispute,
);

router.post(
  '/admin/withdraw-fees', // Simplified since there's only one withdraw method now
  authenticate,
  //   adminMiddleware,
  ContractController.withdrawEscrowFees,
);

// --- Registration Routes ---
router.post(
  '/register/buyer',
  authenticate, ContractController.registerBuyer,
);
router.post(
  '/register/seller',
  authenticate,
  ContractController.registerSeller,
);

// --- Trade Creation and Management ---
router.post('/trades', /**authenticate,**/ ContractController.createTrade);

router.post('/trades/:tradeId/buy', authenticate, ContractController.buyTrade);

// --- Purchase Management Routes (New purchase-based operations) ---
router.post(
  '/purchases/:purchaseId/confirm-delivery', // Changed from trade-based to purchase-based
  authenticate,
  ContractController.confirmDelivery,
);

router.post(
  '/purchases/:purchaseId/confirm-purchase', // New endpoint for final purchase confirmation
  authenticate,
  ContractController.confirmPurchase,
);

router.post(
  '/purchases/:purchaseId/cancel', // Changed from trade-based to purchase-based
  authenticate,
  ContractController.cancelPurchase,
);

router.post(
  '/purchases/:purchaseId/dispute', // Changed from trade-based to purchase-based
  authenticate,
  ContractController.raiseDispute,
);

// --- Read Routes for Trades ---
router.get(
  '/trades/:tradeId',
  authenticate,
  ContractController.getTradeDetails,
);

router.get(
  '/trades/seller/list', // Get trades created by current user (seller)
  authenticate,
  ContractController.getSellerTrades,
);

// --- Read Routes for Purchases ---
router.get(
  '/purchases/:purchaseId', // New endpoint to get individual purchase details
  authenticate,
  ContractController.getPurchaseDetails,
);

router.get(
  '/purchases/buyer/list', // Get purchases made by current user (buyer)
  authenticate,
  ContractController.getBuyerPurchases,
);

router.get(
  '/purchases/provider/list', // Get purchases assigned to current user (logistics provider)
  authenticate,
  ContractController.getProviderTrades,
);

// --- Logistics Provider Routes ---
router.get(
  '/logistics',
  authenticate,
  ContractController.getLogisticsProviders,
);

// --- USDT Utility Routes ---
router.get(
  '/usdt/balance/:address', // Get USDT balance for an address
  authenticate,
  ContractController.getUSDTBalance,
);

router.post(
  '/usdt/approve', // Approve USDT spending
  authenticate,
  ContractController.approveUSDT,
);

// --- Account Balance Routes ---
// router.get(
//   '/balances/check/:address?', // Check both CELO and USDT balances
//   /**authenticate,**/
//   ContractController.checkAccountBalances,
// );

export default router;
