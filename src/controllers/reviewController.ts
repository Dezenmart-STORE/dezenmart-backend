import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';

export class ReviewController {
  static createReview = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    const review = await ReviewService.createReview({
      reviewer: req.user.id,
      reviewed: req.body.reviewed,
      order: req.body.order,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json(review);
  };

  static updateUserRating = async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    await ReviewService.updateUserRating(userId);
    res.json({ success: true });
  };

  static getUserReviews = async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const reviews = await ReviewService.getReviewsForUser(
      userId,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(reviews);
  };

  static getOrderReview = async (req: Request, res: Response) => {
    const orderId = Array.isArray(req.params.orderId)
      ? req.params.orderId[0]
      : req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const review = await ReviewService.getReviewForOrder(orderId);
    res.json(review);
  };
}
