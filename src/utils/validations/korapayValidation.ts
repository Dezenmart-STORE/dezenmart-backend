import Joi from 'joi';

export const KorapayValidation = {
  initiate: Joi.object({
    body: Joi.object({
      bookingRef: Joi.string().required(),
    }),
  }),

  verify: Joi.object({
    params: Joi.object({
      reference: Joi.string().required(),
    }),
  }),
};
