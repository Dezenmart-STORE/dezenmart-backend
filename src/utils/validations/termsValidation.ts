import Joi from 'joi';
import { Schemas } from '../validation';
import { TERMS_TYPES } from '../../models/termsModel';

const termsFields = {
  type: Joi.string().valid(...TERMS_TYPES),
  title: Joi.string().min(1).max(200),
  content: Joi.string().min(1),
  version: Joi.string().min(1).max(50),
  isActive: Joi.boolean(),
};

export const TermsValidation = {
  create: Joi.object({
    body: Joi.object({
      ...termsFields,
      type: termsFields.type.required(),
      title: termsFields.title.required(),
      content: termsFields.content.required(),
    }),
  }),

  update: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object(termsFields).min(1),
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
      isActive: Joi.string().valid('true', 'false').optional(),
      type: termsFields.type.optional(),
    }),
  }),

  current: Joi.object({
    query: Joi.object({
      type: termsFields.type.required(),
    }),
  }),
};
