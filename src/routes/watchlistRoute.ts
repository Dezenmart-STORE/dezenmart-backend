import express from 'express';
import { WatchlistController } from '../controllers/watchlistController';
import { WatchlistValidation } from '../utils/validations/watchlistValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post(
  '/:productId',
  authenticate,
  validate(WatchlistValidation.addRemove),
  WatchlistController.addWatchlist,
);
router.delete(
  '/:productId',
  authenticate,
  validate(WatchlistValidation.addRemove),
  WatchlistController.removeWatchlist,
);
router.get(
  '/',
  authenticate,
  validate(WatchlistValidation.getWatchlists),
  WatchlistController.getWatchlists,
);
router.get(
  '/:productId/check',
  authenticate,
  validate(WatchlistValidation.checkWatchlist),
  WatchlistController.checkWatchlist,
);

export default router;
