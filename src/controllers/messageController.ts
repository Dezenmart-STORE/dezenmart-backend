import { Request, Response } from 'express';
import { MessageService } from '../services/messageService';
import { CustomError } from '../middlewares/errorHandler';

export class MessageController {
  static sendMessage = async (req: Request, res: Response) => {
    const { recipient, content, order } = req.body;
    const file = req.file as Express.Multer.File | undefined;

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

    const message = await MessageService.sendMessage(
      req.user.id,
      recipient,
      content,
      order,
      fileUrl,
      fileType,
    );
    res.status(201).json(message);
  };

  static getConversation = async (req: Request, res: Response) => {
    const messages = await MessageService.getConversation(
      req.user.id,
      req.params.userId,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    res.json(messages);
  };

  static markAsRead = async (req: Request, res: Response) => {
    const result = await MessageService.markAsRead(
      req.body.messageIds,
      req.user.id,
    );
    res.json({ success: true, ...result });
  };

  static getConversations = async (req: Request, res: Response) => {
    const conversations = await MessageService.getUserConversations(
      req.user.id,
    );
    res.json(conversations);
  };
}
