import Joi from 'joi';
import { Schemas } from '../validation';

const DELIVERY_STATUSES = [
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'failed',
] as const;

export const DeliveryValidation = {
  create: Joi.object({
    body: Joi.object({
      order: Schemas.id.required(),
      deliveryAddress: Schemas.id.required(),
      logisticsProvider: Schemas.id.optional(),
      weight: Joi.number().positive().optional(),
      deliveryFee: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional(),
      estimatedDeliveryDate: Joi.date().optional(),
    }),
  }),

  update: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      logisticsProvider: Schemas.id.optional(),
      status: Joi.string()
        .valid(...DELIVERY_STATUSES)
        .optional(),
      trackingNumber: Joi.string().max(100).optional(),
      notes: Joi.string().max(500).optional(),
      weight: Joi.number().positive().optional(),
      deliveryFee: Joi.number().min(0).optional(),
      estimatedDeliveryDate: Joi.date().optional(),
    }).min(1),
  }),

  getById: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
  }),

  delete: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
  }),

  list: Joi.object({
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
      status: Joi.string()
        .valid(...DELIVERY_STATUSES)
        .optional(),
    }),
  }),
};
