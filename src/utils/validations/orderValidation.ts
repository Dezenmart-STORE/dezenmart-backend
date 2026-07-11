import Joi from 'joi';
import { Schemas } from '../validation';

const LOGISTICS_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'shipped',
  'delivered',
] as const;

const ORDER_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'completed',
  'disputed',
  'refunded',
  'delivery_confirmed',
  'delivered',
  'shipped',
] as const;

export const OrderValidation = {
  create: Joi.object({
    body: Joi.object({
      product: Schemas.id.required(),
      quantity: Joi.number().positive().precision(2).required(),
      quoteId: Schemas.id.optional(),
      logisticsProvider: Schemas.id.optional(),
      deliveryAddress: Joi.alternatives()
        .try(
          Schemas.id.required(),
          Joi.object({
            label: Joi.string().trim().required(),
            fullName: Joi.string().trim().required(),
            phone: Joi.string().trim().required(),
            country: Joi.string().trim().optional(),
            state: Joi.string().trim().required(),
            lga: Joi.string().trim().required(),
            street: Joi.string().trim().required(),
            zipCode: Joi.string().trim().optional(),
            isDefault: Joi.boolean().optional(),
          }).required(),
        )
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
      status: Joi.string().valid(...ORDER_STATUSES).optional(),
    }),
  }),
  getLogisticsOrders: Joi.object({
    query: Joi.object({
      logisticsStatus: Joi.string().valid(...LOGISTICS_STATUSES).optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  }),
  rejectLogisticsOrder: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
    body: Joi.object({
      reason: Joi.string().min(3).max(500).optional(),
    }),
  }),
  shipOrder: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
    body: Joi.object({
      trackingNumber: Joi.string().max(100).optional(),
      expectedDeliveryDate: Joi.date().iso().optional(),
      notes: Joi.string().max(500).optional(),
    }),
  }),
  acceptLogisticsOrder: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
  }),
  logisticsOrderAction: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
  }),
};
