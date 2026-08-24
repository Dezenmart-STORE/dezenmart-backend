import crypto from 'crypto';

export function generatePaymentReference(prefix: 'pay' | 'txf'): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  return `dzm-${prefix}-${random}-${Date.now()}`;
}
