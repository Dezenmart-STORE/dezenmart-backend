import Joi from 'joi';

export const RiderValidation = {
  register: Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      password: Joi.string().min(8).required(),
      vehicleType: Joi.string().valid('bike', 'car', 'van', 'truck', 'bicycle').required(),
      vehiclePlateNumber: Joi.string().required(),
      driverLicenseNumber: Joi.string().optional(),
      bankName: Joi.string().optional(),
      bankAccountNumber: Joi.string().optional(),
      bankAccountName: Joi.string().optional(),
    }),
  }),

  login: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),

  verifyOtp: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      code: Joi.string().length(6).required(),
    }),
  }),

  withdraw: Joi.object({
    body: Joi.object({
      amount: Joi.number().positive().required(),
    }),
  }),
};
