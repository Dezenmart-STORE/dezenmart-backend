import Joi from 'joi';
import { Schemas } from '../validation';

export const RiderBookingValidation = {
  idParam: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
  }),

  updateStatus: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      status: Joi.string().valid('in_progress').required(),
    }),
  }),

  verifyOtp: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      code: Joi.string().length(6).required(),
    }),
  }),
};
