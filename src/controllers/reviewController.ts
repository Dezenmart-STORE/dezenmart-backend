import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';

export class ReviewController {
  static createReview = async (req: Request, res: Response) => {
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
    await ReviewService.updateUserRating(req.params.userId);
    res.json({ success: true });
  };

  static getUserReviews = async (req: Request, res: Response) => {
    const reviews = await ReviewService.getReviewsForUser(
      req.params.userId,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(reviews);
  };

  static getOrderReview = async (req: Request, res: Response) => {
    const review = await ReviewService.getReviewForOrder(req.params.orderId);
    res.json(review);
  };
}
