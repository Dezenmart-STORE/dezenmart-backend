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
      logisticsProvider: Schemas.id.required(),
      deliveryAddress: Schemas.id.required(),
      deliveryFee: Joi.number().min(0).optional(),
      expectedDeliveryDate: Joi.date().iso().optional(),
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
  logisticsOrderAction: Joi.object({
    params: Joi.object({
      orderId: Schemas.id.required(),
    }),
  }),
};
