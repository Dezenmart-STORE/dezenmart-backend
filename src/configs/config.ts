import dotenv from 'dotenv';
import { Address } from 'viem';

dotenv.config();

interface Config {
  PORT: number;
  nodeEnv: string;
  MONGODB_URI: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  CELO_NODE_URL?: string;
  CONTRACT_ADDRESS?: string;
  USDT_ADDRESS?: string;
  PRIVATE_KEY?: Address;
  IS_TESTNET: boolean;
  SELF_APP_SCOPE: string;
  SELF_BACKEND_URL: string;
  QUIDAX_API_KEY?: string;
  QUIDAX_BASE_URL: string;
  QUIDAX_WEBHOOK_SECRET?: string;
}

const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  CELO_NODE_URL: process.env.CELO_NODE_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  USDT_ADDRESS: process.env.USDT_ADDRESS,
  PRIVATE_KEY:
    process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x')
      ? (process.env.PRIVATE_KEY as Address)
      : undefined,
  IS_TESTNET: process.env.IS_TESTNET === 'true',
  SELF_APP_SCOPE: process.env.SELF_APP_SCOPE || 'dezenmart-app',
  SELF_BACKEND_URL: process.env.SELF_BACKEND_URL || '',
  QUIDAX_API_KEY: process.env.QUIDAX_API_KEY,
  QUIDAX_BASE_URL: process.env.QUIDAX_BASE_URL || 'https://ramp-be.quidax.io/api/v1',
  QUIDAX_WEBHOOK_SECRET: process.env.QUIDAX_WEBHOOK_SECRET,
};

export default config;
