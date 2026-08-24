import config from '../configs/config';
import { CustomError } from '../middlewares/errorHandler';
import { Order } from '../models/orderModel';
import { Logistics } from '../models/logisticsModel';
import { User, Role } from '../models/userModel';
import { IFiatAccount } from '../models/schemas/fiatAccountSchema';
import { FiatPayout, FiatPayoutLegType } from '../models/fiatPayoutModel';
import { FiatPayment } from '../models/fiatPaymentModel';
import { getPaymentGateway, PaymentProvider } from './paymentGateways/paymentGatewayService';
import { generatePaymentReference } from '../utils/helpers/generatePaymentReference';
import { NotificationService } from './notificationService';
import { RewardService } from './rewardService';

interface ILeg {
  legType: FiatPayoutLegType;
  recipientType: 'user' | 'logistics';
  recipientId: string;
  grossAmount: number;
  fiatAccount: IFiatAccount | null | undefined;
}

export class PayoutService {
  private static async notifyAdminsOfBlockedLeg(orderId: string, legType: FiatPayoutLegType) {
    const admins = await User.find({ roles: Role.ADMIN }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        NotificationService.createNotification({
          recipient: admin._id.toString(),
          type: 'FIAT_PAYOUT_BLOCKED',
          message: `Payout blocked for order ${orderId} (${legType} leg): no verified fiat account on file.`,
          metadata: { orderId, legType },
        }),
      ),
    );
  }

  static async triggerOrderPayout(orderId: string, opts: { force?: boolean } = {}) {
    const guardFilter: Record<string, unknown> = { _id: orderId, paymentMethod: 'fiat' };
    if (!opts.force) {
      guardFilter.payoutStatus = { $in: ['none', 'failed'] };
    }

    const order = await Order.findOneAndUpdate(
      guardFilter,
      { $set: { payoutStatus: 'processing' } },
      { new: true },
    )
      .populate('product')
      .populate('seller')
      .populate('logisticsProvider');

    if (!order) {
      // Already processing/completed and not forced — safe no-op (idempotency).
      return;
    }

    const successfulCharge = await FiatPayment.findOne({ order: order._id, status: 'success' });
    if (!successfulCharge) {
      order.payoutStatus = 'failed';
      await order.save();
      return;
    }

    const product = order.product as any;
    const seller = order.seller as any;
    const logisticsProvider = order.logisticsProvider as any;

    const legs: ILeg[] = [
      {
        legType: 'seller',
        recipientType: 'user',
        recipientId: seller._id.toString(),
        grossAmount: order.amount,
        fiatAccount: product?.sellerBankAccount ?? seller?.fiatAccount,
      },
    ];

    if (order.deliveryFee && order.deliveryFee > 0 && logisticsProvider) {
      legs.push({
        legType: 'logistics',
        recipientType: 'logistics',
        recipientId: logisticsProvider._id.toString(),
        grossAmount: order.deliveryFee,
        fiatAccount: logisticsProvider?.fiatAccount,
      });
    }

    for (const leg of legs) {
      await this.processLeg(order._id.toString(), leg);
    }

    await this.reconcileOrderPayoutStatus(order._id.toString());
  }

  private static async processLeg(orderId: string, leg: ILeg) {
    const existing = await FiatPayout.findOne({ order: orderId, legType: leg.legType });
    if (existing && ['success', 'processing'].includes(existing.status)) {
      return;
    }

    if (!leg.fiatAccount || !leg.fiatAccount.accountNumber) {
      await FiatPayout.findOneAndUpdate(
        { order: orderId, legType: leg.legType },
        {
          $setOnInsert: {
            order: orderId,
            legType: leg.legType,
            recipientType: leg.recipientType,
            recipientId: leg.recipientId,
            provider: 'paystack',
            transferReference: generatePaymentReference('txf'),
            grossAmount: leg.grossAmount,
            netAmount: leg.grossAmount,
          },
          $set: { status: 'blocked', failureReason: 'No verified fiat account on file' },
        },
        { upsert: true, new: true },
      );
      await this.notifyAdminsOfBlockedLeg(orderId, leg.legType);
      return;
    }

    const provider = (leg.fiatAccount.provider ?? 'paystack') as PaymentProvider;
    const gateway = getPaymentGateway(provider);
    const transferReference = generatePaymentReference('txf');

    const payout = await FiatPayout.findOneAndUpdate(
      { order: orderId, legType: leg.legType },
      {
        $setOnInsert: {
          order: orderId,
          legType: leg.legType,
          recipientType: leg.recipientType,
          recipientId: leg.recipientId,
          transferReference,
          grossAmount: leg.grossAmount,
          feeAmount: 0,
          netAmount: leg.grossAmount,
        },
        $set: { provider, status: 'processing', failureReason: undefined },
      },
      { upsert: true, new: true },
    );

    try {
      const recipient = await gateway.createTransferRecipient({
        accountNumber: leg.fiatAccount.accountNumber,
        bankCode: leg.fiatAccount.bankCode,
        accountName: leg.fiatAccount.accountName,
      });

      const transfer = await gateway.initiateTransfer({
        amount: payout.netAmount,
        currency: config.FIAT_CURRENCY,
        recipientCode: recipient.recipientCode,
        accountNumber: leg.fiatAccount.accountNumber,
        bankCode: leg.fiatAccount.bankCode,
        reference: payout.transferReference,
        reason: `Dezenmart order ${orderId} — ${leg.legType} payout`,
      });

      payout.recipientCode = recipient.recipientCode;
      payout.gatewayData = transfer.raw;
      if (transfer.status === 'success') {
        payout.status = 'success';
        payout.completedAt = new Date();
      }
      await payout.save();
    } catch (error) {
      payout.status = 'failed';
      payout.failureReason = error instanceof Error ? error.message : 'Transfer initiation failed';
      await payout.save();
    }
  }

  static async handleTransferWebhook(provider: PaymentProvider, transferReference: string) {
    const payout = await FiatPayout.findOne({ transferReference });
    if (!payout) return;
    if (['success', 'blocked'].includes(payout.status)) return; // already terminal

    const gateway = getPaymentGateway(provider);
    const result = await gateway.verifyTransfer(transferReference);

    if (result.status === 'success') {
      payout.status = 'success';
      payout.completedAt = new Date();
      payout.gatewayData = result.raw;
      await payout.save();
    } else if (result.status === 'failed') {
      payout.status = 'failed';
      payout.gatewayData = result.raw;
      await payout.save();
    } else {
      return; // still pending — nothing to reconcile yet
    }

    await this.reconcileOrderPayoutStatus(payout.order.toString());
  }

  private static async reconcileOrderPayoutStatus(orderId: string) {
    const legs = await FiatPayout.find({ order: orderId });
    if (legs.length === 0) return;

    const allTerminal = legs.every((leg) => ['success', 'failed', 'blocked'].includes(leg.status));
    if (!allTerminal) return;

    const allSuccess = legs.every((leg) => leg.status === 'success');
    const sellerLeg = legs.find((leg) => leg.legType === 'seller');

    const order = await Order.findById(orderId);
    if (!order) return;

    order.payoutStatus = allSuccess ? 'completed' : 'partially_completed';
    order.payoutCompletedAt = new Date();

    if (sellerLeg?.status === 'success' && order.status !== 'completed') {
      order.status = 'completed';
      order.completedAt = new Date();
    }

    await order.save();

    if (sellerLeg?.status === 'success') {
      await RewardService.processOrderRewards(orderId);
      await RewardService.processDeliveryConfirmation(orderId);
    }
  }

  static async getPayoutStatus(orderId: string) {
    const [order, legs] = await Promise.all([
      Order.findById(orderId).select('payoutStatus payoutCompletedAt'),
      FiatPayout.find({ order: orderId }),
    ]);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    return {
      payoutStatus: order.payoutStatus,
      payoutCompletedAt: order.payoutCompletedAt ?? null,
      legs,
    };
  }
}
