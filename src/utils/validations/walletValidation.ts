import Joi from 'joi';

export const WalletValidation = {
  setup: Joi.object({
    body: Joi.object({
      walletAddress: Joi.string()
        .pattern(/^0x[a-fA-F0-9]{40}$/)
        .required()
        .messages({ 'string.pattern.base': 'walletAddress must be a valid Ethereum address (0x...)' }),
      chainId: Joi.number().integer().required(),
      provider: Joi.string().required(),
      dynamicUserId: Joi.string().optional(),
    }),
  }),
};
