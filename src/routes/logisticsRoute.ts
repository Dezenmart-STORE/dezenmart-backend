import express from 'express';
import { LogisticsController } from '../controllers/logisticsProviderController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, LogisticsController.createLogistics);
router.get('/', authenticate, LogisticsController.getAllLogistics);
router.get('/:id', authenticate, LogisticsController.getLogisticsById);
router.put('/:id', authenticate, LogisticsController.updateLogistics);
router.delete('/:id', authenticate, LogisticsController.deleteLogistics);

export default router;
