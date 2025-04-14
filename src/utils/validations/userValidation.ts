import Joi from 'joi';
import { Schemas } from '../validation';

export const UserValidation = {
  // For POST /users/register
  register: Joi.object({
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{8,30}$'))
        .required(),
      profileImage: Joi.string().uri().optional(),
      isMerchant: Joi.boolean().default(false),
    }),
  }),

  // For POST /users/login
  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),

  // For PUT /users/profile
  updateProfile: Joi.object({
    body: Joi.object({
      username: Joi.string().alphanum().min(3).max(30).optional(),
      email: Joi.string().email().optional(),
      password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{8,30}$'))
        .optional(),
      profileImage: Joi.string().uri().optional(),
      isMerchant: Joi.boolean().optional(),
    }).min(1), // At least one field is required
  }),
};
