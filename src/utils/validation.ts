import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { CustomError } from '../middlewares/errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const toValidate = {
      query: req.query,
      body: req.body,
      params: req.params,
    };

    const { error } = schema.validate(toValidate, {
      abortEarly: false, // Return all errors, not just the first one
      allowUnknown: true, // Allow unknown keys that will be ignored
      stripUnknown: true, // Remove unknown keys from output
    });

    if (error) {
      next(new CustomError('Validation Error', 422, 'fail'));
      return;
    }

    next();
  };
};

/**
 * Common Joi schemas that can be reused
 */
export const Schemas = {
  id: Joi.string().hex().length(24).messages({
    'string.hex': 'must be a valid mongo id',
    'string.length': 'must be 24 characters long',
  }),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  },
};
