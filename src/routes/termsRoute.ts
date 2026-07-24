import express from 'express';
import { TermsController } from '../controllers/termsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '../models/userModel';
import { validate } from '../utils/validation';
import { TermsValidation } from '../utils/validations/termsValidation';

const router = express.Router();

router.get('/current', validate(TermsValidation.current), TermsController.getCurrent);
router.get('/', validate(TermsValidation.list), TermsController.list);
router.get('/:id', validate(TermsValidation.getById), TermsController.getById);

router.post(
  '/',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(TermsValidation.create),
  TermsController.create,
);
router.put(
  '/:id',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(TermsValidation.update),
  TermsController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles(Role.ADMIN),
  validate(TermsValidation.delete),
  TermsController.delete,
);

export default router;
