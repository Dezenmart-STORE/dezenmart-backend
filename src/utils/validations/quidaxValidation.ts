import Joi from 'joi';

const customerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
}).unknown(true);

const walletAddressSchema = Joi.object().unknown(true).required();

export const QuidaxValidation = {
  initiateOnRamp: Joi.object({
    body: Joi.object({
      from_currency: Joi.string().optional().default('ngn'),
      to_currency: Joi.string().optional().default('usdt'),
      from_amount: Joi.string().required(),
      customer: customerSchema.required(),
      wallet_address: walletAddressSchema,
    }),
  }),

  refreshOnRamp: Joi.object({
    body: Joi.object({
      from_currency: Joi.string().optional().default('ngn'),
      to_currency: Joi.string().optional().default('usdt'),
      from_amount: Joi.string().required(),
    }),
  }),

  initiateOffRamp: Joi.object({
    body: Joi.object({
      from_currency: Joi.string().optional().default('usdt'),
      to_currency: Joi.string().optional().default('ngn'),
      from_amount: Joi.string().required(),
      network: Joi.string().required(),
      customer: customerSchema.required(),
    }),
  }),

  addBankAccount: Joi.object({
    body: Joi.object({
      bank_code: Joi.string().required(),
      account_number: Joi.string().required(),
    }),
  }),
};
