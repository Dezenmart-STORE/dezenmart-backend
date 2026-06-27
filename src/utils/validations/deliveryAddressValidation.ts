import Joi from 'joi';
import { Schemas } from '../validation';

const addressFields = {
  label: Joi.string().min(1).max(50),
  fullName: Joi.string().min(2).max(100),
  phone: Joi.string().min(7).max(20),
  country: Joi.string().min(2).max(100),
  state: Joi.string().min(2).max(100),
  lga: Joi.string().min(2).max(100),
  street: Joi.string().min(3).max(255),
  zipCode: Joi.string().max(20).allow('', null),
  isDefault: Joi.boolean(),
};

export const DeliveryAddressValidation = {
  create: Joi.object({
    body: Joi.object({
      ...addressFields,
      label: addressFields.label.required(),
      fullName: addressFields.fullName.required(),
      phone: addressFields.phone.required(),
      state: addressFields.state.required(),
      lga: addressFields.lga.required(),
      street: addressFields.street.required(),
    }),
  }),

  update: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object(addressFields).min(1),
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
    }),
  }),
};
