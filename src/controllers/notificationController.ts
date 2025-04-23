import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  static getNotifications = async (req: Request, res: Response) => {
    const notifications = await NotificationService.getUserNotifications(
      req.user.id,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(notifications);
  };

  static markAsRead = async (req: Request, res: Response) => {
    const result = await NotificationService.markAsRead(
      req.body.notificationIds,
      req.user.id,
    );
    res.json({ success: true, ...result });
  };

  static getUnreadCount = async (req: Request, res: Response) => {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ count });
  };
}
