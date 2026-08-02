import express from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../utils/validation';
import { WalletValidation } from '../utils/validations/walletValidation';

const router = express.Router();

router.get('/status', authenticate, WalletController.getStatus);
router.post('/setup', authenticate, validate(WalletValidation.setup), WalletController.setup);

export default router;
