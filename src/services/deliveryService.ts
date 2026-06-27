import { Delivery, DeliveryStatus } from '../models/deliveryModel';
import { Order } from '../models/orderModel';
import { Logistics } from '../models/logisticsModel';
import { Role } from '../models/userModel';
import { CustomError } from '../middlewares/errorHandler';
import { generateDeliveryId } from '../utils/helpers/generate-delivery-id';
import { DeliveryAddressService } from './deliveryAddressService';

export interface CreateDeliveryInput {
  order: string;
  deliveryAddress: string;
  logisticsProvider?: string;
  weight?: number;
  deliveryFee?: number;
  notes?: string;
  estimatedDeliveryDate?: Date;
}

export interface UpdateDeliveryInput {
  logisticsProvider?: string;
  status?: DeliveryStatus;
  trackingNumber?: string;
  notes?: string;
  weight?: number;
  deliveryFee?: number;
  estimatedDeliveryDate?: Date;
}

export class DeliveryService {
  static async createDelivery(userId: string, input: CreateDeliveryInput) {
    const order = await Order.findById(input.order);
    if (!order) {
      throw new CustomError('Order not found', 404, 'fail');
    }

    if (order.buyer.toString() !== userId) {
      throw new CustomError('You can only create deliveries for your own orders', 403, 'fail');
    }

    const existingDelivery = await Delivery.findOne({ order: input.order });
    if (existingDelivery) {
      throw new CustomError('A delivery already exists for this order', 409, 'fail');
    }

    await DeliveryAddressService.getAddressById(userId, input.deliveryAddress);

    if (input.logisticsProvider) {
      const provider = await Logistics.findById(input.logisticsProvider);
      if (!provider) {
        throw new CustomError('Logistics provider not found', 404, 'fail');
      }
    }

    const delivery = new Delivery({
      deliveryId: generateDeliveryId(),
      order: input.order,
      buyer: userId,
      deliveryAddress: input.deliveryAddress,
      logisticsProvider: input.logisticsProvider,
      weight: input.weight,
      deliveryFee: input.deliveryFee,
      notes: input.notes,
      estimatedDeliveryDate: input.estimatedDeliveryDate,
      status: input.logisticsProvider ? 'assigned' : 'pending',
    });

    return delivery.save();
  }

  static async getDeliveries(
    userId: string,
    roles: Role[],
    page = 1,
    limit = 10,
    status?: DeliveryStatus,
  ) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (roles.includes(Role.ADMIN)) {
      // Admin sees all deliveries
    } else if (roles.includes(Role.LOGISTICS_AGENT)) {
      const provider = await Logistics.findOne({ userId });
      if (!provider) {
        throw new CustomError('Logistics provider profile not found', 404, 'fail');
      }
      filter.logisticsProvider = provider._id;
    } else {
      filter.buyer = userId;
    }

    if (status) {
      filter.status = status;
    }

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter)
        .populate('order', 'orderId status amount quantity')
        .populate('buyer', 'name email phoneNumber')
        .populate('logisticsProvider', 'name email phone rating')
        .populate('deliveryAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Delivery.countDocuments(filter),
    ]);

    return { deliveries, total, page, limit };
  }

  static async getDeliveryById(userId: string, roles: Role[], deliveryId: string) {
    const delivery = await Delivery.findById(deliveryId)
      .populate('order', 'orderId status amount quantity product')
      .populate('buyer', 'name email phoneNumber')
      .populate('logisticsProvider', 'name email phone rating walletAddress')
      .populate('deliveryAddress');

    if (!delivery) {
      throw new CustomError('Delivery not found', 404, 'fail');
    }

    if (!this.canAccessDelivery(userId, roles, delivery)) {
      throw new CustomError('You do not have permission to view this delivery', 403, 'fail');
    }

    return delivery;
  }

  static async updateDelivery(
    userId: string,
    roles: Role[],
    deliveryId: string,
    updates: UpdateDeliveryInput,
  ) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new CustomError('Delivery not found', 404, 'fail');
    }

    const isAdmin = roles.includes(Role.ADMIN);
    const isLogisticsAgent = roles.includes(Role.LOGISTICS_AGENT);

    if (!isAdmin && !isLogisticsAgent) {
      throw new CustomError('Only logistics agents or admins can update deliveries', 403, 'fail');
    }

    if (isLogisticsAgent && !isAdmin) {
      const provider = await Logistics.findOne({ userId });
      if (
        !provider ||
        !delivery.logisticsProvider ||
        delivery.logisticsProvider.toString() !== provider._id.toString()
      ) {
        throw new CustomError('You can only update deliveries assigned to you', 403, 'fail');
      }
    }

    if (updates.logisticsProvider) {
      const provider = await Logistics.findById(updates.logisticsProvider);
      if (!provider) {
        throw new CustomError('Logistics provider not found', 404, 'fail');
      }
      delivery.logisticsProvider = provider._id;
      if (delivery.status === 'pending') {
        delivery.status = 'assigned';
      }
    }

    if (updates.status) {
      delivery.status = updates.status;
      if (updates.status === 'delivered') {
        delivery.deliveredAt = new Date();
      }
    }

    if (updates.trackingNumber !== undefined) delivery.trackingNumber = updates.trackingNumber;
    if (updates.notes !== undefined) delivery.notes = updates.notes;
    if (updates.weight !== undefined) delivery.weight = updates.weight;
    if (updates.deliveryFee !== undefined) delivery.deliveryFee = updates.deliveryFee;
    if (updates.estimatedDeliveryDate !== undefined) {
      delivery.estimatedDeliveryDate = updates.estimatedDeliveryDate;
    }

    return delivery.save();
  }

  static async deleteDelivery(userId: string, roles: Role[], deliveryId: string) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new CustomError('Delivery not found', 404, 'fail');
    }

    const isAdmin = roles.includes(Role.ADMIN);
    const isBuyer = delivery.buyer.toString() === userId;

    if (!isAdmin && !isBuyer) {
      throw new CustomError('You do not have permission to cancel this delivery', 403, 'fail');
    }

    if (!isAdmin && !['pending', 'assigned'].includes(delivery.status)) {
      throw new CustomError('Only pending or assigned deliveries can be cancelled', 400, 'fail');
    }

    delivery.status = 'cancelled';
    await delivery.save();
    return { success: true };
  }

  private static getLogisticsProviderId(delivery: {
    logisticsProvider?: { _id?: { toString(): string }; toString(): string } | null;
  }): string | null {
    if (!delivery.logisticsProvider) return null;
    const provider = delivery.logisticsProvider as { _id?: { toString(): string } };
    return provider._id?.toString() ?? delivery.logisticsProvider.toString();
  }

  private static async canAccessDelivery(
    userId: string,
    roles: Role[],
    delivery: {
      buyer: { toString(): string };
      logisticsProvider?: { _id?: { toString(): string }; toString(): string } | null;
    },
  ) {
    if (roles.includes(Role.ADMIN)) return true;
    if (delivery.buyer.toString() === userId) return true;

    if (roles.includes(Role.LOGISTICS_AGENT)) {
      const provider = await Logistics.findOne({ userId });
      const providerId = this.getLogisticsProviderId(delivery);
      if (provider && providerId && providerId === provider._id.toString()) {
        return true;
      }
    }

    return false;
  }
}
