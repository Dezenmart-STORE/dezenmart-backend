import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';
import { CustomError } from '../middlewares/errorHandler';

export class MessageController {
  static sendMessage = async (req: Request, res: Response) => {
    const { recipient, content, order } = req.body;
    const file = req.file as any;

    if (!content && !file) {
      throw new CustomError(
        'Message must have either content or a file.',
        400,
        'fail',
      );
    }

    let fileUrl: string | undefined;
    let fileType: string | undefined;

    if (file) {
      fileUrl = file.path;
      fileType = file.mimetype;
    }

    if (!req.user || !(req.user as any).id) {
      throw new CustomError(
        'Unauthorized: user not found on request.',
        401,
        'fail',
      );
    }

    const message = await MessageService.sendMessage(
      (req.user as any).id,
      recipient,
      content,
      order,
      fileUrl,
      fileType,
    );
    res.status(201).json(message);
  };

  static getConversation = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const messages = await MessageService.getConversation(
      (req.user as any).id,
      userId,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    res.json(messages);
  };

  static markAsRead = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const result = await MessageService.markAsRead(
      req.body.messageIds,
      (req.user as any).id,
    );
    res.json({ success: true, ...result });
  };

  static getConversations = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const conversations = await MessageService.getUserConversations(
      (req.user as any).id,
    );
    res.json(conversations);
  };
}