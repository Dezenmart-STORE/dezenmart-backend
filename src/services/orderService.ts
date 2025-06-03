import { Order } from '../models/orderModel';
import { CustomError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';
import { NotificationService } from './notificationService';
import { RewardService } from './rewardService';
import { Product, IProduct } from '../models/productModel';

export class OrderService {
  static async createOrder(orderInput: {
    product: string;
    buyer: string;
    logisticsProviderWalletAddress: string;
    quantity: number;
  }) {
    if (orderInput.quantity <= 0) {
      throw new CustomError('Quantity must be greater than zero', 400, 'fail');
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
      product: updatedProduct._id,
      buyer: orderInput.buyer,
      seller: updatedProduct.seller,
      amount,
      quantity: orderInput.quantity,
      sellerWalletAddress: updatedProduct.sellerWalletAddress,
      logisticsProviderWalletAddress: orderInput.logisticsProviderWalletAddress,
    });

    const savedOrder = await order.save();
    await NotificationService.createNotification({
      recipient: updatedProduct.seller.toString(),
      type: 'ORDER_PLACED',
      message: `New order placed for ${updatedProduct.name}`,
      metadata: { orderId: savedOrder._id },
    });

    return savedOrder;
  }

  static async getOrderById(id: string) {
    const order = await Order.findById(id)
      .populate('product', 'name price images tradeId')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'name profileImage rating');

    if (!order) throw new CustomError('Order not found', 404, 'fail');
    return order;
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
        | 'delivery_confirmed';
      purchaseId?: string;
    },
    userId: string,
  ) {
    const order = await Order.findById(id);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    // Verify user has permission to update this order
    if (
      order.seller.toString() !== userId &&
      order.buyer.toString() !== userId
    ) {
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

    return updatedOrder;
  }

  static async getUserOrders(userId: string, type: 'buyer' | 'seller') {
    const query = type === 'buyer' ? { buyer: userId } : { seller: userId };
    return await Order.find(query)
      .populate('product', 'name price images')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'name profileImage rating')
      .sort({ createdAt: -1 });
  }

  static async raiseDispute(orderId: string, userId: string, reason: string) {
    if (!Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(userId)) {
      throw new CustomError('Invalid order or user ID', 400, 'fail');
    }

    const order = await Order.findById(orderId);
    if (!order) throw new CustomError('Order not found', 404, 'fail');

    const userObjectId = new Types.ObjectId(userId);

    // Verify user has permission to raise dispute for this order
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

    return await order.save();
  }
}
