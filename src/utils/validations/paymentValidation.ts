import Joi from 'joi';
import { Schemas } from '../validation';

const providerSchema = Joi.string().valid('paystack', 'flutterwave').required();

export const PaymentValidation = {
  getBanks: Joi.object({
    query: Joi.object({
      provider: providerSchema,
    }),
  }),

  resolveAccount: Joi.object({
    body: Joi.object({
      accountNumber: Joi.string().trim().required(),
      bankCode: Joi.string().trim().required(),
      provider: providerSchema,
    }),
  }),

  setFiatAccount: Joi.object({
    body: Joi.object({
      bankName: Joi.string().trim().required(),
      bankCode: Joi.string().trim().required(),
      accountNumber: Joi.string().trim().required(),
      provider: providerSchema,
    }),
  }),

  initializePayment: Joi.object({
    params: Joi.object({
      id: Schemas.id.required(),
    }),
    body: Joi.object({
      provider: providerSchema,
    }),
  }),
};
