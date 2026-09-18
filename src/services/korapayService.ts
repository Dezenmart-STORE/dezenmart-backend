import crypto from 'crypto';
import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { Booking } from '../models/bookingModel';
import { IKorapayTransaction, KorapayTransaction } from '../models/korapayTransactionModel';

function generatePaymentReference(bookingRef: string): string {
  return `EXP-PAY-${bookingRef}-${Date.now().toString(36).toUpperCase()}`;
}

async function korapayRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = config.KORAPAY_BASE_URL.replace(/\/$/, '');
  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.KORAPAY_SECRET_KEY ?? ''}`,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const message = (data.message as string) || (data.error as string) || 'Korapay API error';
    throw new CustomError(message, res.status, 'fail');
  }

  return data as T;
}

export class KorapayService {
  static async initiateCharge(bookingRef: string) {
    const booking = await Booking.findOne({ bookingRef });
    if (!booking) {
      throw new CustomError('Booking not found', 404, 'fail');
    }

    if (booking.paymentStatus === 'paid') {
      throw new CustomError('This booking has already been paid for', 409, 'fail');
    }

    const reference = generatePaymentReference(booking.bookingRef);

    const payload = {
      amount: booking.fareAmount,
      currency: booking.currency,
      reference,
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
      },
      notification_url: `${process.env.API_BASE_URL ?? ''}/api/v1/express/payments/webhook`,
    };

    const data = await korapayRequest<{ data?: Record<string, unknown> }>(
      'POST',
      '/charges/initialize',
      payload,
    );

    const checkoutUrl = (data.data?.checkout_url as string) ?? undefined;

    const transaction = await KorapayTransaction.create({
      booking: booking._id,
      reference,
      amount: booking.fareAmount,
      currency: booking.currency,
      customerEmail: booking.customerEmail,
      checkoutUrl,
      providerData: data,
    });

    booking.paymentStatus = 'pending';
    booking.paymentTransaction = transaction._id as typeof booking.paymentTransaction;
    await booking.save();

    return { reference, checkoutUrl };
  }

  static async verifyTransaction(reference: string) {
    const transaction = await KorapayTransaction.findOne({ reference });
    if (!transaction) {
      throw new CustomError('Payment transaction not found', 404, 'fail');
    }

    const data = await korapayRequest<{ data?: Record<string, unknown> }>(
      'GET',
      `/charges/${reference}`,
    );

    const providerStatus = (data.data?.status as string) ?? undefined;
    await applyProviderStatus(transaction, providerStatus, data);

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
    };
  }

  static async handleWebhook(
    rawBody: string,
    signature: string | undefined,
    payload: Record<string, unknown>,
  ) {
    if (config.KORAPAY_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', config.KORAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expected) {
        throw new CustomError('Invalid webhook signature', 401, 'fail');
      }
    }

    const data = (payload.data as Record<string, unknown>) ?? {};
    const reference = data.reference as string | undefined;
    if (!reference) return;

    const transaction = await KorapayTransaction.findOne({ reference });
    if (!transaction) return;

    const providerStatus = data.status as string | undefined;
    await applyProviderStatus(transaction, providerStatus, payload);
  }
}

async function applyProviderStatus(
  transaction: IKorapayTransaction,
  providerStatus: string | undefined,
  providerData: Record<string, unknown>,
) {
  const statusMap: Record<string, IKorapayTransaction['status']> = {
    success: 'success',
    successful: 'success',
    failed: 'failed',
    abandoned: 'abandoned',
  };

  const mappedStatus = providerStatus ? statusMap[providerStatus.toLowerCase()] : undefined;

  transaction.providerData = providerData;
  if (mappedStatus) transaction.status = mappedStatus;
  if (mappedStatus === 'success') transaction.paidAt = new Date();
  await transaction.save();

  if (mappedStatus === 'success') {
    await Booking.findByIdAndUpdate(transaction.booking, { paymentStatus: 'paid' });
  } else if (mappedStatus === 'failed' || mappedStatus === 'abandoned') {
    await Booking.findByIdAndUpdate(transaction.booking, { paymentStatus: 'failed' });
  }
}
