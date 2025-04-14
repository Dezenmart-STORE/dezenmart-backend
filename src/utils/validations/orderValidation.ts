import Joi from 'joi';
import { Schemas } from '../validation';

export const OrderValidation = {
  create: Joi.object({
    body: Joi.object({
      product: Schemas.id.required(),
      amount: Joi.number().positive().precision(2).required(),
    }),
  }),
  updateStatus: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      status: Joi.string()
        .valid('accepted', 'rejected', 'completed')
        .required(),
    }),
  }),
  dispute: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      reason: Joi.string().min(10).max(500).required(),
    }),
  }),
  getUserOrders: Joi.object({
    query: Joi.object({
      type: Joi.string().valid('buyer', 'seller').required(),
      status: Joi.string()
        .valid(
          'pending',
          'accepted',
          'rejected',
          'completed',
          'disputed',
          'refunded',
        )
        .optional(),
    }),
  }),
};
