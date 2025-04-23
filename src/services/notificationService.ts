import { Notification } from '../models/notificationModel';
import { WebSocketService } from './webSocketService';

export class NotificationService {
  private static webSocketService: WebSocketService;

  public static initialize(webSocketService: WebSocketService) {
    NotificationService.webSocketService = webSocketService;
  }

  static async createNotification(notificationData: {
    recipient: string;
    type: string;
    message: string;
    metadata?: any;
  }) {
    const notification = new Notification(notificationData);
    await notification.save();

    if (NotificationService.webSocketService) {
      NotificationService.webSocketService.sendToUser(
        notificationData.recipient,
        {
          type: 'NOTIFICATION',
          data: notification,
        },
      );
    }

    return notification;
  }

  static async getUserNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await Notification.find({ recipient: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  static async markAsRead(notificationIds: string[], userId: string) {
    return await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId,
        read: false,
      },
      { $set: { read: true } },
    );
  }

  static async getUnreadCount(userId: string) {
    return await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
  }
}
