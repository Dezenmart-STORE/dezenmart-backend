import Joi from 'joi';
import { Schemas } from '../validation';

export const ProductValidation = {
  // For POST /products
  create: Joi.object({
    body: Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().min(10).max(1000).required(),
      price: Joi.number().positive().precision(2).required(),
      type: Joi.array().items(
        Joi.object()
          .pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number()))
          .min(1)
          .required()
      ).min(1).required(),
      category: Joi.string().required(),
      sellerWalletAddress: Joi.string().required(),
      stock: Joi.number().integer().min(0).required(),
      useUSDT: Joi.boolean().required(),
      isSponsored: Joi.boolean().default(false),
      isActive: Joi.boolean().default(true),
    }),
  }),

  // For PUT /products/:id
  update: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      name: Joi.string().min(3).max(100).optional(),
      description: Joi.string().min(10).max(1000).optional(),
      price: Joi.number().positive().precision(2).optional(),
      category: Joi.string().optional(),
      isSponsored: Joi.boolean().optional(),
      isActive: Joi.boolean().optional(),
    }).min(1), // At least one field is required
  }),

  // For GET /products/category/:category
  byCategory: Joi.object({
    params: Joi.object({
      category: Joi.string().required(),
    }),
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),

  // For GET /products/search
  search: Joi.object({
    query: Joi.object({
      q: Joi.string().min(1).required(),
      category: Joi.string().optional(),
      minPrice: Joi.number().positive().precision(2).optional(),
      maxPrice: Joi.number().positive().precision(2).optional(),
    }),
  }),
};
