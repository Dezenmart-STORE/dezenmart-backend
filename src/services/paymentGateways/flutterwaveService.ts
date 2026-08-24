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

async function flutterwaveRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = config.FLUTTERWAVE_BASE_URL.replace(/\/$/, '');
  const url = `${base}${path}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok || data.status === 'error') {
    const message = (data.message as string) || 'Flutterwave API error';
    throw new CustomError(message, res.status || 502, 'fail');
  }

  return data as T;
}

const FLUTTERWAVE_CHARGE_STATUS_MAP: Record<string, IChargeStatus> = {
  successful: 'success',
  failed: 'failed',
  pending: 'pending',
};

const FLUTTERWAVE_TRANSFER_STATUS_MAP: Record<string, ITransferStatus> = {
  successful: 'success',
  failed: 'failed',
  new: 'pending',
  pending: 'pending',
};

export const flutterwaveService: IPaymentGatewayService = {
  async initializeCharge(input: IInitializeChargeInput): Promise<IInitializeChargeResult> {
    const data = await flutterwaveRequest<{ data: { link: string } }>('POST', '/payments', {
      tx_ref: input.reference,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.callbackUrl,
      customer: { email: input.email },
    });

    return {
      authorizationUrl: data.data.link,
      reference: input.reference,
      raw: data,
    };
  },

  async verifyCharge(reference: string): Promise<IVerifyChargeResult> {
    const data = await flutterwaveRequest<{
      data: { status: string; amount: number; currency: string };
    }>('GET', `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`);

    return {
      status: FLUTTERWAVE_CHARGE_STATUS_MAP[data.data.status] ?? 'pending',
      amount: data.data.amount,
      currency: data.data.currency,
      raw: data,
    };
  },

  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<IResolveAccountResult> {
    const data = await flutterwaveRequest<{ data: { account_name: string } }>(
      'POST',
      '/accounts/resolve',
      { account_number: accountNumber, account_bank: bankCode },
    );

    return { accountName: data.data.account_name };
  },

  async getBanks(): Promise<IBank[]> {
    const data = await flutterwaveRequest<{ data: Array<{ name: string; code: string }> }>(
      'GET',
      '/banks/NG',
    );

    return data.data.map((bank) => ({ name: bank.name, code: bank.code }));
  },

  async createTransferRecipient(
    input: ICreateTransferRecipientInput,
  ): Promise<ICreateTransferRecipientResult> {
    return { recipientCode: input.accountNumber };
  },

  async initiateTransfer(input: IInitiateTransferInput): Promise<IInitiateTransferResult> {
    const data = await flutterwaveRequest<{
      data: { id: number; reference: string; status: string };
    }>('POST', '/transfers', {
      account_bank: input.bankCode,
      account_number: input.accountNumber,
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      narration: input.reason,
    });

    return {
      transferReference: data.data.reference,
      status: FLUTTERWAVE_TRANSFER_STATUS_MAP[data.data.status?.toLowerCase()] ?? 'pending',
      raw: data,
    };
  },

  async verifyTransfer(
    transferReference: string,
  ): Promise<{ status: ITransferStatus; raw: unknown }> {
    const data = await flutterwaveRequest<{ data: Array<{ status: string }> }>(
      'GET',
      `/transfers?reference=${encodeURIComponent(transferReference)}`,
    );

    const transfer = data.data?.[0];
    return {
      status: transfer
        ? (FLUTTERWAVE_TRANSFER_STATUS_MAP[transfer.status?.toLowerCase()] ?? 'pending')
        : 'pending',
      raw: data,
    };
  },

  verifyWebhookSignature(_rawBody, headers): boolean {
    if (!config.FLUTTERWAVE_WEBHOOK_SECRET_HASH) return false;

    const signature = headers['verif-hash'];
    return signature === config.FLUTTERWAVE_WEBHOOK_SECRET_HASH;
  },
};
