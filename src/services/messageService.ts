import { Message } from '../models/messageModel';
import { NotificationService } from './notificationService';
import { Types } from 'mongoose';

export class MessageService {
  static async sendMessage(
    senderId: string,
    recipientId: string,
    content?: string,
    orderId?: string,
    fileUrl?: string,
    fileType?: string,
  ) {
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      order: orderId,
      fileUrl,
      fileType,
    });
    await message.save();

    await NotificationService.createNotification({
      recipient: recipientId,
      type: 'NEW_MESSAGE',
      message: 'You have a new message',
      metadata: {
        sender: senderId,
        content,
        orderId,
        fileUrl,
        fileType,
      },
    });

    return message;
  }

  static async getConversation(
    user1Id: string,
    user2Id: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    return await Message.find({
      $or: [
        { sender: user1Id, recipient: user2Id },
        { sender: user2Id, recipient: user1Id },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage');
  }

  static async markAsRead(messageIds: string[], userId: string) {
    return await Message.updateMany(
      {
        _id: { $in: messageIds },
        recipient: userId,
        read: false,
      },
      { $set: { read: true } },
    );
  }

  static async getUserConversations(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      console.error(
        'Invalid userId format passed to getUserConversations:',
        userId,
      );
      return [];
    }
    const userObjectId = new Types.ObjectId(userId);

    return await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { recipient: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userObjectId] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userObjectId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser',
        },
      },
      {
        $unwind: {
          path: '$otherUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$otherUser._id',
            name: '$otherUser.name',
            profileImage: '$otherUser.profileImage',
          },
          lastMessage: '$lastMessage',
          unreadCount: '$unreadCount',
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);
  }
}
