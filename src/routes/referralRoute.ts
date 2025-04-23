import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { ReferralController } from '../controllers/referralController';

const router = express.Router();

router.post('/apply', authenticate, ReferralController.applyReferralCode);
router.get('/info', authenticate, ReferralController.getReferralInfo);

export default router;
