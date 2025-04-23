import Joi from 'joi';
import { Schemas } from '../validation';

export const ReviewValidation = {
  create: Joi.object({
    body: Joi.object({
      reviewed: Schemas.id.required(),
      order: Schemas.id.required(),
      rating: Joi.number().min(1).max(5).required(),
      comment: Joi.string().max(500).optional(),
    }),
  }),
  updateUserRating: Joi.object({
    params: Joi.object({
      userId: Schemas.id.required(),
    }),
  }),
  getUserReviews: Joi.object({
    params: Joi.object({
      userId: Schemas.id.required(),
    }),
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),
  getOrderReview: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
  }),
};
