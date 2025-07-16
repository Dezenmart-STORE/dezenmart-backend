import express from 'express';
import { MentoController } from '../controllers/mentoController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

// Get a swap quote
router.post('/quote', MentoController.getQuote);

// Execute a swap
router.post('/swap', authenticate, MentoController.swapTokens);

export default router;
