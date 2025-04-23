import Joi from 'joi';
import { Schemas } from '../validation';

export const UserValidation = {
  updateProfile: Joi.object({
    body: Joi.object({
      name: Joi.string().min(3).max(30).optional(),
      isMerchant: Joi.boolean().optional(),
      dateOfBirth: Joi.date().optional(),
      phoneNumber: Joi.string().optional(),
      address: Joi.string().optional(),
    }).min(1), // At least one field is required
  }),

  getUserByEmail: Joi.object({
    params: Joi.object({
      email: Joi.string().email().required(),
    }),
  }),

  getUserById: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
  }),

  deleteUser: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
  }),

  getAllUsers: Joi.object({
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),
};
