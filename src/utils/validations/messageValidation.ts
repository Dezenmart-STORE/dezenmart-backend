import Joi from 'joi';
import { Schemas } from '../validation';

export const MessageValidation = {
  send: Joi.object({
    body: Joi.object({
      recipient: Schemas.id.required(),
      content: Joi.string().min(1).max(1000).allow('').optional(),
      order: Schemas.id.optional(),
    }),
  }),
  conversation: Joi.object({
    params: Joi.object({
      userId: Schemas.id.required(),
    }),
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),
  markAsRead: Joi.object({
    body: Joi.object({
      messageIds: Joi.array().items(Schemas.id).min(1).required(),
    }),
  }),
};
