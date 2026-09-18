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
  KORAPAY_SECRET_KEY?: string;
  KORAPAY_PUBLIC_KEY?: string;
  KORAPAY_WEBHOOK_SECRET?: string;
  KORAPAY_BASE_URL: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM_EMAIL?: string;
  SMTP_FROM_NAME?: string;
  OTP_HASH_SECRET?: string;
  OTP_EXPIRY_MINUTES: number;
  RIDER_JWT_SECRET?: string;
  RIDER_JWT_EXPIRES_IN?: string;
  EXPRESS_PLATFORM_FEE_PERCENT: number;
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
  KORAPAY_SECRET_KEY: process.env.KORAPAY_SECRET_KEY,
  KORAPAY_PUBLIC_KEY: process.env.KORAPAY_PUBLIC_KEY,
  KORAPAY_WEBHOOK_SECRET: process.env.KORAPAY_WEBHOOK_SECRET,
  KORAPAY_BASE_URL: process.env.KORAPAY_BASE_URL || 'https://api.korapay.com/merchant/api/v1',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Dezenmart Express',
  OTP_HASH_SECRET: process.env.OTP_HASH_SECRET,
  OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
  RIDER_JWT_SECRET: process.env.RIDER_JWT_SECRET,
  RIDER_JWT_EXPIRES_IN: process.env.RIDER_JWT_EXPIRES_IN || '30d',
  EXPRESS_PLATFORM_FEE_PERCENT: Number(process.env.EXPRESS_PLATFORM_FEE_PERCENT) || 20,
};

export default config;
