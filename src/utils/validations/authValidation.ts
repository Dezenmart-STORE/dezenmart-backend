import Joi from 'joi';

export const AuthValidation = {
  googleOneTap: Joi.object({
    body: Joi.object({
      credential: Joi.string().required().messages({
        'any.required': 'credential is required',
        'string.empty': 'credential is required',
      }),
    }),
  }),
};
