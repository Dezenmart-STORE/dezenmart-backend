import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import config from '../configs/config';

const isProduction = config.nodeEnv === 'production';
const productionUrl = process.env.API_BASE_URL;

const servers = productionUrl
  ? [
      { url: `${productionUrl}/api/v1`, description: 'Production' },
      { url: `http://localhost:${config.PORT}/api/v1`, description: 'Local development' },
    ]
  : [
      { url: `http://localhost:${config.PORT}/api/v1`, description: 'Local development' },
    ];

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Dezenmart API',
    version: '1.0.0',
    description:
      'Dezenmart backend API — marketplace, logistics, blockchain contracts, and token exchange.',
    contact: {
      name: 'Dezenmart',
    },
  },
  servers,
  tags: [
    { name: 'Auth', description: 'Google OAuth authentication' },
    { name: 'Users', description: 'User profile and verification' },
    { name: 'Products', description: 'Product catalog management' },
    { name: 'Orders', description: 'Order lifecycle' },
    { name: 'Reviews', description: 'User and order reviews' },
    { name: 'Rewards', description: 'Reward points' },
    { name: 'Referral', description: 'Referral program' },
    { name: 'Watchlist', description: 'Product watchlist' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Messages', description: 'Direct messaging' },
    { name: 'Contracts', description: 'On-chain trade and purchase management' },
    { name: 'Mento', description: 'Token swap via Mento protocol' },
    { name: 'Logistics', description: 'Logistics provider management' },
    { name: 'Exchange Rate', description: 'Token exchange rate and purchases' },
    { name: 'Deliveries', description: 'Order delivery tracking and management' },
    { name: 'Delivery Addresses', description: 'User saved delivery addresses' },
    { name: 'Ramp', description: 'Quidax on-ramp (NGN → crypto) and off-ramp (crypto → NGN) conversion' },
    { name: 'Terms', description: 'Terms and conditions content management' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    path.join(process.cwd(), 'src/swagger/schemas.ts'),
    path.join(process.cwd(), 'src/swagger/paths/*.ts'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
