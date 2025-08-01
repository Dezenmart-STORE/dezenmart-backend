import express from 'express';
import { UserController } from '../controllers/userController';
import { UserValidation } from '../utils/validations/userValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadSingleImage } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.get('/profile', authenticate, UserController.getProfile);
router.put(
  '/profile',
  authenticate,
  uploadSingleImage('profileImage'),
  validate(UserValidation.updateProfile),
  UserController.updateProfile,
);
router.post('/accept-terms', authenticate, UserController.acceptTerms);
router.get('/terms-status', authenticate, UserController.getTermsStatus);
router.get(
  '/:id',
  authenticate,
  validate(UserValidation.getUserById),
  UserController.getUserById,
);
router.delete(
  '/:id',
  authenticate,
  validate(UserValidation.deleteUser),
  UserController.deleteUser,
);
router.get(
  '/email/:email',
  authenticate,
  validate(UserValidation.getUserByEmail),
  UserController.getUserByEmail,
);
router.get(
  '/',
  authenticate,
  validate(UserValidation.getAllUsers),
  UserController.getAllUsers,
);
router.post('/verify-self', authenticate, UserController.verifySelf);
router.get(
  '/self/status',
  authenticate,
  UserController.getSelfVerificationStatus,
);
router.delete(
  '/self/revoke',
  authenticate,
  UserController.revokeSelfVerification,
);

export default router;
