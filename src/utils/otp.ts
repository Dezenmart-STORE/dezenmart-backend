import crypto from 'crypto';
import config from '../configs/config';

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtpCode(code: string): string {
  return crypto
    .createHmac('sha256', config.OTP_HASH_SECRET ?? 'otp-secret')
    .update(code)
    .digest('hex');
}
