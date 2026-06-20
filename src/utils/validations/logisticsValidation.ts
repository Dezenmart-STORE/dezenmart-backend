import Joi from 'joi';
import { Schemas } from '../validation';

const coverageAreaSchema = Joi.object({
  state: Joi.string().required(),
  lgas: Joi.array().items(Joi.string()).default([]),
  isStatewide: Joi.boolean().default(false),
});

const weightTierSchema = Joi.object({
  minWeight: Joi.number().min(0).required(),
  maxWeight: Joi.number().min(0).greater(Joi.ref('minWeight')).required(),
  price: Joi.number().min(0).required(),
});

const DELIVERY_TYPES = ['intra_lga', 'inter_lga_same_state', 'inter_state'];
const SORT_OPTIONS = ['price', 'days', 'rating'];

export const LogisticsValidation = {
  onboardMe: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      phone: Joi.string().min(7).max(20).required(),
      walletAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .required()
        .messages({ 'string.pattern.base': 'walletAddress must be a valid Ethereum address (0x...)' }),
      coverageAreas: Joi.array().items(coverageAreaSchema).default([]),
    }),
  }),

  updateMe: Joi.object({
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      phone: Joi.string().min(7).max(20).optional(),
      coverageAreas: Joi.array().items(coverageAreaSchema).optional(),
      isActive: Joi.boolean().optional(),
    }).min(1),
  }),

  createPricingRule: Joi.object({
    body: Joi.object({
      deliveryType: Joi.string().valid(...DELIVERY_TYPES).required(),
      fromState: Joi.string().required(),
      fromLga: Joi.string().when('deliveryType', {
        is: Joi.valid('intra_lga', 'inter_lga_same_state'),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      toState: Joi.string().required(),
      toLga: Joi.string().when('deliveryType', {
        is: Joi.valid('intra_lga', 'inter_lga_same_state'),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      weightTiers: Joi.array().items(weightTierSchema).min(1).required(),
      insuranceFee: Joi.number().min(0).default(0),
      packagingFee: Joi.number().min(0).default(0),
      estimatedDaysMin: Joi.number().integer().min(1).required(),
      estimatedDaysMax: Joi.number().integer().min(Joi.ref('estimatedDaysMin')).required(),
    }),
  }),

  updatePricingRule: Joi.object({
    params: Joi.object({
      ruleId: Schemas.id.required(),
    }),
    body: Joi.object({
      weightTiers: Joi.array().items(weightTierSchema).min(1).optional(),
      insuranceFee: Joi.number().min(0).optional(),
      packagingFee: Joi.number().min(0).optional(),
      estimatedDaysMin: Joi.number().integer().min(1).optional(),
      estimatedDaysMax: Joi.number().integer().min(1).optional(),
      isActive: Joi.boolean().optional(),
    }).min(1),
  }),

  getAvailableProviders: Joi.object({
    query: Joi.object({
      fromState: Joi.string().required(),
      fromLga: Joi.string().required(),
      toState: Joi.string().required(),
      toLga: Joi.string().required(),
      weight: Joi.number().positive().required(),
      sort: Joi.string().valid(...SORT_OPTIONS).default('price'),
    }),
  }),
};
