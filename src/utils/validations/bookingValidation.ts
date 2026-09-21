import Joi from 'joi';
import { Schemas } from '../validation';

const addressSchema = Joi.object({
  label: Joi.string().optional(),
  address: Joi.string().required(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
}).required();

const baseBookingFields = {
  customerName: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerPhone: Joi.string().required(),
  pickupAddress: addressSchema,
  dropoffAddress: addressSchema,
  distanceKm: Joi.number().min(0).optional(),
  fareAmount: Joi.number().positive().required(),
  currency: Joi.string().optional(),
  notes: Joi.string().optional(),
};

export const BookingValidation = {
  bookRide: Joi.object({
    body: Joi.object({
      ...baseBookingFields,
      rideType: Joi.string().valid('standard', 'premium').optional(),
      passengerCount: Joi.number().integer().min(1).optional(),
    }),
  }),

  bookDelivery: Joi.object({
    body: Joi.object({
      ...baseBookingFields,
      package: Joi.object({
        description: Joi.string().required(),
        sizeCategory: Joi.string().valid('small', 'medium', 'large').optional(),
        weightKg: Joi.number().min(0).optional(),
        value: Joi.number().min(0).optional(),
      }).required(),
      recipientName: Joi.string().required(),
      recipientPhone: Joi.string().required(),
    }),
  }),

  lookupOrders: Joi.object({
    query: Joi.object({
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }).or('email', 'phone'),
  }),

  bookingRefParam: Joi.object({
    params: Joi.object({
      bookingRef: Joi.string().required(),
    }),
  }),

  cancel: Joi.object({
    params: Joi.object({
      bookingRef: Joi.string().required(),
    }),
    body: Joi.object({
      reason: Joi.string().optional(),
    }),
  }),
};
