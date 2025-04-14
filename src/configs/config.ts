import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number;
  nodeEnv: string;
  MONGODB_URI: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
}

const config: Config = {
  PORT: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
};

export default config;
