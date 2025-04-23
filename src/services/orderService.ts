import { Order } from '../models/orderModel';
import { CustomError } from '../middlewares/errorHandler';
import { Types } from 'mongoose';
import { NotificationService } from './notificationService';
import { RewardService } from './rewardService';

export class OrderService {
  static async createOrder(orderData: {
    product: string;
    buyer: string;
    seller: string;
    amount: number;
  }) {
    const order = new Order(orderData);
    return await order.save();
  }

  static async getOrderById(id: string) {
    const order = await Order.findById(id)
      .populate('product', 'name price images')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'name profileImage rating');

    if (!order) throw new CustomError('Order not found', 404, 'fail');
    return order;
  }

  static async updateOrderStatus(
    id: string,
    status:
      | 'pending'
      | 'accepted'
      | 'rejected'
      | 'completed'
      | 'disputed'
      | 'refunded'
      | 'delivery_confirmed',
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

    order.status = status;
    const updatedOrder = await order.save();

    if (status === 'completed') {
      await RewardService.processOrderRewards(id);
    }

    // Process rewards when delivery is confirmed
    if (status === 'delivery_confirmed') {
      await RewardService.processDeliveryConfirmation(id);
    }

    const recipient =
      order.seller.toString() === userId ? order.buyer : order.seller;

    await NotificationService.createNotification({
      recipient: recipient.toString(),
      type: 'ORDER_UPDATE',
      message: `Order status updated to ${status}`,
      metadata: { orderId: id },
    });

    return updatedOrder;
  }

  static async getUserOrders(userId: string, type: 'buyer' | 'seller') {
    const query = type === 'buyer' ? { buyer: userId } : { seller: userId };
    return await Order.find(query)
      .populate('product', 'name price images')
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
