import crypto from 'crypto';
import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { QuidaxTransaction, RampStatus } from '../models/quidaxTransactionModel';

interface OnRampInitiateBody {
  from_currency?: string;
  to_currency?: string;
  from_amount: string;
  customer: Record<string, unknown>;
  wallet_address: Record<string, unknown>;
}

interface OffRampInitiateBody {
  from_currency?: string;
  to_currency?: string;
  from_amount: string;
  network: string;
  customer: Record<string, unknown>;
}

interface RefreshOnRampBody {
  from_currency?: string;
  to_currency?: string;
  from_amount: string;
}

function generateMerchantReference(userId: string): string {
  return `dezenmrt-${userId.slice(-6)}-${Date.now()}`;
}

async function quidaxRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = config.QUIDAX_BASE_URL.replace(/\/$/, '');
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-private-key': config.QUIDAX_API_KEY ?? '',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const message =
      (data.message as string) || (data.error as string) || 'Quidax API error';
    throw new CustomError(message, res.status, 'fail');
  }

  return data as T;
}

export class QuidaxService {
  // ── On-Ramp ───────────────────────────────────────────────────────────────

  static async initiateOnRamp(userId: string, body: OnRampInitiateBody) {
    const merchantReference = generateMerchantReference(userId);

    const payload = {
      from_currency: body.from_currency ?? 'ngn',
      to_currency: body.to_currency ?? 'usdt',
      from_amount: body.from_amount,
      merchant_reference: merchantReference,
      customer: body.customer,
      wallet_address: body.wallet_address,
    };

    const data = await quidaxRequest<Record<string, unknown>>(
      'POST',
      '/merchants/custodial/on_ramp_transactions/initiate',
      payload,
    );

    await QuidaxTransaction.create({
      userId,
      type: 'on_ramp',
      status: 'initiated',
      merchantReference,
      fromCurrency: payload.from_currency,
      toCurrency: payload.to_currency,
      fromAmount: payload.from_amount,
      quidaxData: data,
    });

    return { merchantReference, quidaxData: data };
  }

  static async confirmOnRamp(merchantRef: string) {
    const data = await quidaxRequest<Record<string, unknown>>(
      'POST',
      `/merchants/custodial/on_ramp_transactions/${merchantRef}/confirm`,
    );

    await QuidaxTransaction.findOneAndUpdate(
      { merchantReference: merchantRef },
      { status: 'confirmed', quidaxData: data },
    );

    return data;
  }

  static async refreshOnRamp(merchantRef: string, body: RefreshOnRampBody) {
    const payload = {
      from_currency: body.from_currency ?? 'ngn',
      to_currency: body.to_currency ?? 'usdt',
      from_amount: body.from_amount,
    };

    const data = await quidaxRequest<Record<string, unknown>>(
      'PUT',
      `/merchants/custodial/on_ramp_transactions/${merchantRef}/refresh`,
      payload,
    );

    await QuidaxTransaction.findOneAndUpdate(
      { merchantReference: merchantRef },
      { quidaxData: data, fromAmount: payload.from_amount },
    );

    return data;
  }

  static async fetchOnRampTransaction(merchantRef: string) {
    return quidaxRequest<Record<string, unknown>>(
      'GET',
      `/merchants/on_ramp_transaction/${merchantRef}`,
    );
  }

  // ── Off-Ramp ──────────────────────────────────────────────────────────────

  static async initiateOffRamp(userId: string, body: OffRampInitiateBody) {
    const merchantReference = generateMerchantReference(userId);

    const payload = {
      from_currency: body.from_currency ?? 'usdt',
      to_currency: body.to_currency ?? 'ngn',
      from_amount: body.from_amount,
      network: body.network,
      merchant_reference: merchantReference,
      customer: body.customer,
    };

    const data = await quidaxRequest<Record<string, unknown>>(
      'POST',
      '/merchants/custodial/off_ramp_transactions/initiate',
      payload,
    );

    await QuidaxTransaction.create({
      userId,
      type: 'off_ramp',
      status: 'initiated',
      merchantReference,
      fromCurrency: payload.from_currency,
      toCurrency: payload.to_currency,
      fromAmount: payload.from_amount,
      quidaxData: data,
    });

    return { merchantReference, quidaxData: data };
  }

  static async confirmOffRamp(merchantRef: string) {
    const data = await quidaxRequest<Record<string, unknown>>(
      'POST',
      `/merchants/custodial/off_ramp_transactions/${merchantRef}/confirm`,
    );

    await QuidaxTransaction.findOneAndUpdate(
      { merchantReference: merchantRef },
      { status: 'confirmed', quidaxData: data },
    );

    return data;
  }

  static async addBankAccountToOffRamp(
    merchantRef: string,
    bankCode: string,
    accountNumber: string,
  ) {
    return quidaxRequest<Record<string, unknown>>(
      'POST',
      `/merchants/custodial/off_ramp_transactions/${merchantRef}/bank_account`,
      { bank_code: bankCode, account_number: accountNumber },
    );
  }

  static async fetchOffRampTransaction(merchantRef: string) {
    return quidaxRequest<Record<string, unknown>>(
      'GET',
      `/merchants/off_ramp_transaction/${merchantRef}`,
    );
  }

  // ── Banks ─────────────────────────────────────────────────────────────────

  static async getBanks() {
    return quidaxRequest<Record<string, unknown>>('GET', '/merchants/custodial/banks');
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  static async handleWebhook(
    rawBody: string,
    signature: string | undefined,
    payload: Record<string, unknown>,
  ) {
    if (config.QUIDAX_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', config.QUIDAX_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expected) {
        throw new CustomError('Invalid webhook signature', 401, 'fail');
      }
    }

    const merchantRef = payload.merchant_reference as string | undefined;
    const statusMap: Record<string, RampStatus> = {
      completed: 'completed',
      failed: 'failed',
      confirmed: 'confirmed',
    };
    const incomingStatus = payload.status as string | undefined;
    const mappedStatus = incomingStatus ? statusMap[incomingStatus] : undefined;

    if (merchantRef) {
      const update: Record<string, unknown> = { quidaxData: payload };
      if (mappedStatus) update.status = mappedStatus;
      await QuidaxTransaction.findOneAndUpdate({ merchantReference: merchantRef }, update);
    }
  }
}
