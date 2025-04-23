import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { NotificationValidation } from '../utils/validations/notificationValidation';
import { validate } from '../utils/validation';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.get(
  '/',
  authenticate,
  validate(NotificationValidation.getNotifications),
  NotificationController.getNotifications,
);
router.post(
  '/mark-read',
  authenticate,
  validate(NotificationValidation.markAsRead),
  NotificationController.markAsRead,
);
router.get(
  '/unread-count',
  authenticate,
  NotificationController.getUnreadCount,
);

export default router;
