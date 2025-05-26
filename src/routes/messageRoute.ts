import express from 'express';
import { MessageController } from '../controllers/messageController';
import { MessageValidation } from '../utils/validations/messageValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';
import { uploadSingleImage } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.post(
  '/',
  authenticate,
  uploadSingleImage('messageFile'),
  validate(MessageValidation.send),
  MessageController.sendMessage,
);
router.get(
  '/:userId',
  authenticate,
  validate(MessageValidation.conversation),
  MessageController.getConversation,
);
router.post(
  '/mark-read',
  authenticate,
  validate(MessageValidation.markAsRead),
  MessageController.markAsRead,
);
router.get('/', authenticate, MessageController.getConversations);

export default router;
