import express from 'express';
import { RewardController } from '../controllers/rewardController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authenticate, RewardController.getUserRewards);
router.get('/summary', authenticate, RewardController.getPointsSummary);

export default router;
