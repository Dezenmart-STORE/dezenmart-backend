import { Order, LogisticsStatus } from '../models/orderModel';
import { Logistics } from '../models/logisticsModel';
import { CustomError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';
import { NotificationService } from './notificationService';
import { RewardService } from './rewardService';
import { Product } from '../models/productModel';
import { generateOrderId } from '../utils/helpers/generate-unique-dummy-orderId';
import { CreateDeliveryAddressInput, DeliveryAddressService } from './deliveryAddressService';
import { LogisticsQuote } from '../models/logisticsQuoteModel';

const ORDER_POPULATE = [
  { path: 'product', select: 'name price images category' },
  { path: 'buyer', select: 'name profileImage email phoneNumber' },
  { path: 'seller', select: 'name profileImage rating email phoneNumber' },
  {
    path: 'logisticsProvider',
    select:
      'name companyName location email phone walletAddress coverageAreas rating totalDeliveries verificationStatus isActive',
  },
  { path: 'deliveryAddress' },
];

export class OrderService {
  private static serializeOrder(order: any) {
    const plainOrder = order.toObject ? order.toObject() : order;
    return {
      ...plainOrder,
      deliveryFee: plainOrder.deliveryFee ?? null,
      expectedDeliveryDate: plainOrder.expectedDeliveryDate ?? null,
    };
  }

  private static async findOrderWithDetails(id: string) {
    const order = await Order.findById(id).populate(ORDER_POPULATE);
    if (!order) throw new CustomError('Order not found', 404, 'fail');
    return this.serializeOrder(order);
  }

  private static async getProviderForUser(userId: string) {
    const provider = await Logistics.findOne({ userId });
    if (!provider) {
      throw new CustomError('Logistics provider profile not found', 404, 'fail');
    }
    return provider;
  }

  private static async assertProviderOwnsOrder(
    orderId: string,
    userId: string,
  ) {
    const provider = await this.getProviderForUser(userId);
    const order = await Order.findById(orderId);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    if (
      !order.logisticsProvider ||
      order.logisticsProvider.toString() !== provider._id.toString()
    ) {
      throw new CustomError(
        'This order is not assigned to your logistics company',
        403,
        'fail',
      );
    }

    return { order, provider };
  }

  static async createOrder(orderInput: {
    product: string;
    buyer: string;
    quoteId?: string;
    logisticsProvider?: string;
    deliveryAddress: string | CreateDeliveryAddressInput;
    quantity: number;
  }) {
    if (orderInput.quantity <= 0) {
      throw new CustomError('Quantity must be greater than zero', 400, 'fail');
    }

    let provider: any;
    let quote: any;

    if (orderInput.quoteId) {
      quote = await LogisticsQuote.findOne({
        _id: orderInput.quoteId,
        buyer: orderInput.buyer,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      });

      if (!quote) {
        throw new CustomError('Logistics quote not found or expired', 404, 'fail');
      }

      provider = await Logistics.findById(quote.logisticsProvider);
    } else if (orderInput.logisticsProvider) {
      provider = await Logistics.findById(orderInput.logisticsProvider);
    } else {
      throw new CustomError('Either quoteId or logisticsProvider is required', 400, 'fail');
    }
    if (!provider) {
      throw new CustomError('Logistics provider not found', 404, 'fail');
    }
    if (provider.verificationStatus !== 'verified') {
      throw new CustomError(
        'Selected logistics provider is not verified',
        400,
        'fail',
      );
    }
    if (!provider.isActive) {
      throw new CustomError(
        'Selected logistics provider is not currently active',
        400,
        'fail',
      );
    }

    let deliveryAddressId: string;

    if (typeof orderInput.deliveryAddress === 'string') {
      const address = await DeliveryAddressService.getAddressById(
        orderInput.buyer,
        orderInput.deliveryAddress,
      );
      deliveryAddressId = address._id.toString();
    } else {
      const createdAddress = await DeliveryAddressService.createAddress(
        orderInput.buyer,
        orderInput.deliveryAddress,
      );
      deliveryAddressId = createdAddress._id.toString();
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: orderInput.product, stock: { $gte: orderInput.quantity } },
      { $inc: { stock: -orderInput.quantity } },
      { new: true },
    );

    if (!updatedProduct) {
      const existingProduct = await Product.findById(orderInput.product).select(
        'stock name',
      );
      if (!existingProduct) {
        throw new CustomError('Product not found', 404, 'fail');
      }
      throw new CustomError(
        `Insufficient stock for product "${existingProduct.name}". Available: ${existingProduct.stock}, Requested: ${orderInput.quantity}.`,
        400,
        'fail',
      );
    }

    const amount = updatedProduct.price * orderInput.quantity;

    const order = new Order({
      orderId: generateOrderId(),
      product: updatedProduct._id,
      buyer: orderInput.buyer,
      seller: updatedProduct.seller,
      amount,
      quantity: orderInput.quantity,
      stock: updatedProduct.stock,
      sellerWalletAddress: updatedProduct.sellerWalletAddress,
      logisticsProvider: provider._id,
      logisticsProviderWalletAddress: provider.walletAddress,
      deliveryAddress: deliveryAddressId,
      deliveryFee: quote?.breakdown?.totalPrice ?? null,
      expectedDeliveryDate: quote
        ? new Date(Date.now() + quote.estimatedDaysMax * 24 * 60 * 60 * 1000)
        : null,
      logisticsStatus: 'pending',
      status: 'pending',
    });

    const savedOrder = await order.save();

    if (quote) {
      quote.status = 'used';
      await quote.save();
    }

    await NotificationService.createNotification({
      recipient: updatedProduct.seller.toString(),
      type: 'ORDER_PLACED',
      message: `New order placed for ${updatedProduct.name}`,
      metadata: { orderId: savedOrder._id },
    });

    await NotificationService.createNotification({
      recipient: provider.userId.toString(),
      type: 'LOGISTICS_ORDER_PENDING',
      message: `New delivery request for order ${savedOrder.orderId}`,
      metadata: { orderId: savedOrder._id },
    });

    return this.findOrderWithDetails(savedOrder._id.toString());
  }

  static async getOrders() {
    const orders = await Order.find()
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });

    return orders.map((order) => this.serializeOrder(order));
  }

  static async getOrderById(id: string) {
    return this.findOrderWithDetails(id);
  }

  static async getUserOrders(
    userId: string,
    type: 'buyer' | 'seller',
    status?: string,
  ) {
    const query: Record<string, unknown> =
      type === 'buyer' ? { buyer: userId } : { seller: userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate(ORDER_POPULATE)
      .sort({ createdAt: -1 });

    return orders.map((order) => this.serializeOrder(order));
  }

  static async getLogisticsProviderOrders(
    userId: string,
    logisticsStatus?: LogisticsStatus,
    page = 1,
    limit = 10,
  ) {
    const provider = await this.getProviderForUser(userId);
    const filter: Record<string, unknown> = {
      logisticsProvider: provider._id,
    };
    if (logisticsStatus) filter.logisticsStatus = logisticsStatus;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate(ORDER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders.map((order) => this.serializeOrder(order)),
      total,
      page,
      limit,
    };
  }

  static async acceptLogisticsOrder(orderId: string, userId: string) {
    const { order } = await this.assertProviderOwnsOrder(orderId, userId);

    if (order.logisticsStatus !== 'pending') {
      throw new CustomError(
        `Cannot accept order with logistics status "${order.logisticsStatus}"`,
        400,
        'fail',
      );
    }

    order.logisticsStatus = 'accepted';
    order.logisticsAcceptedAt = new Date();
    order.status = 'accepted';
    await order.save();

    await NotificationService.createNotification({
      recipient: order.buyer.toString(),
      type: 'LOGISTICS_ORDER_ACCEPTED',
      message: `Your order ${order.orderId} has been accepted by the logistics provider`,
      metadata: { orderId: order._id },
    });

    return this.findOrderWithDetails(orderId);
  }

  static async rejectLogisticsOrder(
    orderId: string,
    userId: string,
    reason?: string,
  ) {
    const { order } = await this.assertProviderOwnsOrder(orderId, userId);

    if (order.logisticsStatus !== 'pending') {
      throw new CustomError(
        `Cannot reject order with logistics status "${order.logisticsStatus}"`,
        400,
        'fail',
      );
    }

    order.logisticsStatus = 'rejected';
    order.logisticsRejectedAt = new Date();
    order.declineReason = reason;
    order.status = 'rejected';
    await order.save();

    await Product.findByIdAndUpdate(order.product, {
      $inc: { stock: order.quantity },
    });

    await NotificationService.createNotification({
      recipient: order.buyer.toString(),
      type: 'LOGISTICS_ORDER_REJECTED',
      message: `Your order ${order.orderId} was declined by the logistics provider`,
      metadata: { orderId: order._id, reason },
    });

    return this.findOrderWithDetails(orderId);
  }

  static async shipOrder(
    orderId: string,
    userId: string,
    input: {
      trackingNumber?: string;
      expectedDeliveryDate?: string;
      notes?: string;
    },
  ) {
    const { order } = await this.assertProviderOwnsOrder(orderId, userId);

    if (order.logisticsStatus !== 'accepted') {
      throw new CustomError(
        'Order must be accepted before it can be shipped',
        400,
        'fail',
      );
    }

    const shippedAt = new Date();
    order.logisticsStatus = 'shipped';
    order.status = 'shipped';
    order.shippedAt = shippedAt;
    order.trackingNumber = input.trackingNumber;
    order.shippingNotes = input.notes;

    if (input.expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(input.expectedDeliveryDate);
    } else if (!order.expectedDeliveryDate) {
      const eta = new Date(shippedAt);
      eta.setDate(eta.getDate() + 3);
      order.expectedDeliveryDate = eta;
    }

    await order.save();

    await NotificationService.createNotification({
      recipient: order.buyer.toString(),
      type: 'ORDER_SHIPPED',
      message: `Your order ${order.orderId} has been shipped`,
      metadata: {
        orderId: order._id,
        shippedAt: order.shippedAt,
        expectedDeliveryDate: order.expectedDeliveryDate,
        trackingNumber: order.trackingNumber,
        notes: input.notes,
      },
    });

    return this.findOrderWithDetails(orderId);
  }

  static async updateOrder(
    id: string,
    updates: {
      status?:
        | 'pending'
        | 'accepted'
        | 'rejected'
        | 'completed'
        | 'disputed'
        | 'refunded'
        | 'delivery_confirmed'
        | 'delivered'
        | 'shipped';
      purchaseId?: string;
    },
    userId: string,
  ) {
    const order = await Order.findById(id);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    if (order.buyer.toString() !== userId) {
      throw new CustomError('Unauthorized to update this order', 403, 'fail');
    }

    let statusChanged = false;

    if (updates.status && order.status !== updates.status) {
      order.status = updates.status;
      statusChanged = true;
    }
    if (updates.purchaseId) {
      order.purchaseId = updates.purchaseId;
    }

    const updatedOrder = await order.save();

    if (updates.status === 'completed') {
      await RewardService.processOrderRewards(id);
      await RewardService.processDeliveryConfirmation(id);
    }

    if (statusChanged) {
      const recipient =
        order.seller.toString() === userId ? order.buyer : order.seller;

      await NotificationService.createNotification({
        recipient: recipient.toString(),
        type: 'ORDER_UPDATE',
        message: `Order status updated to ${updates.status}`,
        metadata: { orderId: id },
      });
    }

    return this.findOrderWithDetails(updatedOrder._id.toString());
  }

  static async raiseDispute(orderId: string, userId: string, reason: string) {
    if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
      throw new CustomError('Invalid order or user ID', 400, 'fail');
    }

    const order = await Order.findById(orderId);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    const userObjectId = new Types.ObjectId(userId);

    if (
      order.buyer.toString() !== userId &&
      order.seller.toString() !== userId
    ) {
      throw new CustomError(
        'Unauthorized to raise dispute for this order',
        403,
        'fail',
      );
    }

    order.status = 'disputed';
    order.dispute = {
      raisedBy: userObjectId,
      reason,
      resolved: false,
    };

    const saved = await order.save();
    return this.findOrderWithDetails(saved._id.toString());
  }
}
