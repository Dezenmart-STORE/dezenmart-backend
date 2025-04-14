import express from 'express';
import { UserController } from '../controllers/userController';
import { UserValidation } from '../utils/validations/userValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post(
  '/register',
  validate(UserValidation.register),
  UserController.register,
);
router.post('/login', validate(UserValidation.login), UserController.login);
router.get('/profile', authenticate, UserController.getProfile);
router.put(
  '/profile',
  authenticate,
  validate(UserValidation.updateProfile),
  UserController.updateProfile,
);
router.get('/:id', UserController.getUserById);

export default router;
