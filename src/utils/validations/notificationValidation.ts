import Joi from 'joi';
import { Schemas } from '../validation';

export const NotificationValidation = {
  getNotifications: Joi.object({
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),
  markAsRead: Joi.object({
    body: Joi.object({
      notificationIds: Joi.array().items(Schemas.id).min(1).required(),
    }),
  }),
};
