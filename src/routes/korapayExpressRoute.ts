import express from 'express';
import { KorapayController } from '../controllers/korapayController';
import { validate } from '../utils/validation';
import { KorapayValidation } from '../utils/validations/korapayValidation';

const router = express.Router();

router.post('/initiate', validate(KorapayValidation.initiate), KorapayController.initiate);
router.get('/:reference/verify', validate(KorapayValidation.verify), KorapayController.verify);
router.post('/webhook', KorapayController.handleWebhook);

export default router;
