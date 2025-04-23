import Joi from 'joi';
import { Schemas } from '../validation';

export const WatchlistValidation = {
  addRemove: Joi.object({
    params: Joi.object({
      productId: Schemas.id.required(),
    }),
  }),
  getWatchlists: Joi.object({
    query: Joi.object({
      page: Schemas.pagination.page,
      limit: Schemas.pagination.limit,
    }),
  }),
  checkWatchlist: Joi.object({
    params: Joi.object({
      productId: Schemas.id.required(),
    }),
  }),
};
