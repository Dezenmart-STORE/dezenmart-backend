import crypto from 'crypto';
import config from '../../configs/config';
import { CustomError } from '../../middlewares/errorHandler';
import {
  IBank,
  IChargeStatus,
  ICreateTransferRecipientInput,
  ICreateTransferRecipientResult,
  IInitializeChargeInput,
  IInitializeChargeResult,
  IInitiateTransferInput,
  IInitiateTransferResult,
  IPaymentGatewayService,
  IResolveAccountResult,
  ITransferStatus,
  IVerifyChargeResult,
} from './paymentGatewayService';

async function paystackRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = config.PAYSTACK_BASE_URL.replace(/\/$/, '');
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok || data.status === false) {
    const message = (data.message as string) || 'Paystack API error';
    throw new CustomError(message, res.status || 502, 'fail');
  }

  return data as T;
}

const PAYSTACK_STATUS_MAP: Record<string, IChargeStatus> = {
  success: 'success',
  failed: 'failed',
  abandoned: 'failed',
  pending: 'pending',
};

const PAYSTACK_TRANSFER_STATUS_MAP: Record<string, ITransferStatus> = {
  success: 'success',
  failed: 'failed',
  reversed: 'failed',
  pending: 'pending',
  otp: 'pending',
};

export const paystackService: IPaymentGatewayService = {
  async initializeCharge(input: IInitializeChargeInput): Promise<IInitializeChargeResult> {
    const data = await paystackRequest<{
      data: { authorization_url: string; reference: string };
    }>('POST', '/transaction/initialize', {
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
    });

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      raw: data,
    };
  },

  async verifyCharge(reference: string): Promise<IVerifyChargeResult> {
    const data = await paystackRequest<{
      data: { status: string; amount: number; currency: string };
    }>('GET', `/transaction/verify/${encodeURIComponent(reference)}`);

    return {
      status: PAYSTACK_STATUS_MAP[data.data.status] ?? 'pending',
      amount: data.data.amount / 100,
      currency: data.data.currency,
      raw: data,
    };
  },

  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<IResolveAccountResult> {
    const data = await paystackRequest<{ data: { account_name: string } }>(
      'GET',
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    );

    return { accountName: data.data.account_name };
  },

  async getBanks(): Promise<IBank[]> {
    const data = await paystackRequest<{ data: Array<{ name: string; code: string }> }>(
      'GET',
      '/bank?country=nigeria',
    );

    return data.data.map((bank) => ({ name: bank.name, code: bank.code }));
  },

  async createTransferRecipient(
    input: ICreateTransferRecipientInput,
  ): Promise<ICreateTransferRecipientResult> {
    const data = await paystackRequest<{ data: { recipient_code: string } }>(
      'POST',
      '/transferrecipient',
      {
        type: 'nuban',
        name: input.accountName,
        account_number: input.accountNumber,
        bank_code: input.bankCode,
        currency: config.FIAT_CURRENCY,
      },
    );

    return { recipientCode: data.data.recipient_code };
  },

  async initiateTransfer(input: IInitiateTransferInput): Promise<IInitiateTransferResult> {
    const data = await paystackRequest<{
      data: { transfer_code: string; reference: string; status: string };
    }>('POST', '/transfer', {
      source: 'balance',
      amount: Math.round(input.amount * 100),
      recipient: input.recipientCode,
      reference: input.reference,
      reason: input.reason,
    });

    return {
      transferReference: data.data.reference,
      status: PAYSTACK_TRANSFER_STATUS_MAP[data.data.status] ?? 'pending',
      raw: data,
    };
  },

  async verifyTransfer(
    transferReference: string,
  ): Promise<{ status: ITransferStatus; raw: unknown }> {
    const data = await paystackRequest<{ data: { status: string } }>(
      'GET',
      `/transfer/verify/${encodeURIComponent(transferReference)}`,
    );

    return {
      status: PAYSTACK_TRANSFER_STATUS_MAP[data.data.status] ?? 'pending',
      raw: data,
    };
  },

  verifyWebhookSignature(rawBody, headers): boolean {
    if (!rawBody || !config.PAYSTACK_SECRET_KEY) return false;

    const signature = headers['x-paystack-signature'];
    if (typeof signature !== 'string') return false;

    const expected = crypto
      .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  },
};
