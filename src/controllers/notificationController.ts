import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  static getNotifications = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const notifications = await NotificationService.getUserNotifications(
      (req.user as any).id,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(notifications);
  };

  static markAsRead = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const result = await NotificationService.markAsRead(
      req.body.notificationIds,
      (req.user as any).id,
    );
    res.json({ success: true, ...result });
  };

  static getUnreadCount = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const count = await NotificationService.getUnreadCount((req.user as any).id);
    res.json({ count });
  };
}
