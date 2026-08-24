import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { Order } from '../models/orderModel';
import { User } from '../models/userModel';
import { FiatPayment } from '../models/fiatPaymentModel';
import { getPaymentGateway, PaymentProvider } from './paymentGateways/paymentGatewayService';
import { generatePaymentReference } from '../utils/helpers/generatePaymentReference';
import { PayoutService } from './payoutService';

export class PaymentService {
  static async getBanks(provider: PaymentProvider) {
    return getPaymentGateway(provider).getBanks();
  }

  static async resolveAccount(provider: PaymentProvider, accountNumber: string, bankCode: string) {
    return getPaymentGateway(provider).resolveAccountNumber(accountNumber, bankCode);
  }

  static async getUserFiatAccount(userId: string) {
    const user = await User.findById(userId).select('fiatAccount');
    if (!user) throw new CustomError('User not found', 404, 'fail');
    return user.fiatAccount ?? null;
  }

  static async setUserFiatAccount(
    userId: string,
    input: { bankName: string; bankCode: string; accountNumber: string; provider: PaymentProvider },
  ) {
    const gateway = getPaymentGateway(input.provider);
    const resolved = await gateway.resolveAccountNumber(input.accountNumber, input.bankCode);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        fiatAccount: {
          bankName: input.bankName,
          bankCode: input.bankCode,
          accountNumber: input.accountNumber,
          accountName: resolved.accountName,
          provider: input.provider,
          verified: true,
        },
      },
      { new: true },
    );

    if (!user) throw new CustomError('User not found', 404, 'fail');
    return user.fiatAccount;
  }

  static async initializeOrderPayment(orderId: string, buyerId: string, provider: PaymentProvider) {
    const order = await Order.findById(orderId);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    if (order.buyer.toString() !== buyerId) {
      throw new CustomError('Unauthorized to pay for this order', 403, 'fail');
    }
    if (order.paymentMethod !== 'fiat') {
      throw new CustomError('This order is not a fiat-payment order', 400, 'fail');
    }
    if (order.status !== 'pending') {
      throw new CustomError(
        `Cannot initialize payment for an order with status "${order.status}"`,
        400,
        'fail',
      );
    }

    const existingPending = await FiatPayment.findOne({ order: order._id, status: 'pending' });
    if (existingPending) {
      throw new CustomError(
        'A payment is already in progress for this order',
        409,
        'fail',
      );
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) throw new CustomError('Buyer not found', 404, 'fail');

    const baseAmount = order.amount + (order.deliveryFee ?? 0);
    const platformFeeAmount = Math.round((order.amount * config.FIAT_PLATFORM_FEE_PERCENT) / 100);
    const amount = baseAmount + platformFeeAmount;
    const reference = generatePaymentReference('pay');

    const gateway = getPaymentGateway(provider);
    const result = await gateway.initializeCharge({
      amount,
      email: buyer.email,
      reference,
      currency: config.FIAT_CURRENCY,
      callbackUrl: config.FIAT_PAYMENT_CALLBACK_URL,
    });

    await FiatPayment.create({
      order: order._id,
      buyer: buyer._id,
      provider,
      reference: result.reference,
      baseAmount,
      platformFeeAmount,
      amount,
      currency: config.FIAT_CURRENCY,
      status: 'pending',
      authorizationUrl: result.authorizationUrl,
      gatewayData: result.raw,
    });

    order.fiatPaymentProvider = provider;
    order.fiatPaymentReference = result.reference;
    order.platformFeeAmount = platformFeeAmount;
    await order.save();

    return { authorizationUrl: result.authorizationUrl, reference: result.reference };
  }

  private static async confirmCharge(provider: PaymentProvider, reference: string) {
    const payment = await FiatPayment.findOne({ reference });
    if (!payment || payment.status !== 'pending') return; // not found or already terminal — idempotent no-op

    const gateway = getPaymentGateway(provider);
    const verified = await gateway.verifyCharge(reference);

    if (verified.status === 'success') {
      payment.status = 'success';
      payment.paidAt = new Date();
      payment.gatewayData = verified.raw;
      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        status: 'accepted',
        paidAt: new Date(),
      });
    } else if (verified.status === 'failed') {
      payment.status = 'failed';
      payment.gatewayData = verified.raw;
      await payment.save();
    }
  }

  static async handleWebhook(
    provider: PaymentProvider,
    rawBody: Buffer | undefined,
    headers: Record<string, unknown>,
    payload: any,
  ) {
    const gateway = getPaymentGateway(provider);
    if (!gateway.verifyWebhookSignature(rawBody, headers)) {
      throw new CustomError('Invalid webhook signature', 401, 'fail');
    }

    const eventType = payload?.event as string | undefined;

    if (provider === 'paystack') {
      const reference = payload?.data?.reference as string | undefined;
      if (!reference) return;

      if (eventType === 'charge.success') {
        await this.confirmCharge(provider, reference);
      } else if (
        eventType === 'transfer.success' ||
        eventType === 'transfer.failed' ||
        eventType === 'transfer.reversed'
      ) {
        await PayoutService.handleTransferWebhook(provider, reference);
      }
    } else {
      const reference = (payload?.data?.tx_ref ?? payload?.data?.reference) as string | undefined;
      if (!reference) return;

      if (eventType === 'charge.completed') {
        await this.confirmCharge(provider, reference);
      } else if (eventType === 'transfer.completed') {
        await PayoutService.handleTransferWebhook(provider, reference);
      }
    }
  }
}
