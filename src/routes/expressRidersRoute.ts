import express from 'express';
import { RiderController } from '../controllers/riderController';

const router = express.Router();

router.get('/available', RiderController.getAvailable);
router.get('/:riderId', RiderController.getById);

export default router;
