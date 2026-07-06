import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { CustomError } from '../middlewares/errorHandler';
import { LogisticsStatus } from '../models/orderModel';

function getUserId(req: Request): string | null {
  return (req.user as any)?.id ?? (req.user as any)?._id?.toString() ?? null;
}

function extractParam(req: Request, key: string): string | undefined {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export class OrderController {
  static createOrder = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }

    const order = await OrderService.createOrder({
      product: req.body.product,
      buyer: userId,
      logisticsProvider: req.body.logisticsProvider,
      deliveryAddress: req.body.deliveryAddress,
      quantity: req.body.quantity,
      deliveryFee: req.body.deliveryFee,
      expectedDeliveryDate: req.body.expectedDeliveryDate,
    });

    res.status(201).json({
      status: 'success',
      data: { order },
    });
  };

  static getOrders = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const userType = req.query.type as string | undefined;

    if (userId && (userType === 'buyer' || userType === 'seller')) {
      const orders = await OrderService.getUserOrders(
        userId,
        userType,
        req.query.status as string | undefined,
      );
      return res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders },
      });
    }

    const orders = await OrderService.getOrders();
    res.json({
      status: 'success',
      results: orders.length,
      data: { orders },
    });
  };

  static getOrderDetails = async (req: Request, res: Response) => {
    const id = extractParam(req, 'id');
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.getOrderById(id);
    res.json({
      status: 'success',
      data: { order },
    });
  };

  static updateOrder = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }
    const id = extractParam(req, 'id');
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.updateOrder(id, req.body, userId);
    res.json({
      status: 'success',
      data: { order },
    });
  };

  static raiseDispute = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }
    const id = extractParam(req, 'id');
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.raiseDispute(id, userId, req.body.reason);
    res.json({
      status: 'success',
      data: { order },
    });
  };

  static getLogisticsOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return next(new CustomError('User not authenticated', 401, 'fail'));
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const logisticsStatus = req.query.logisticsStatus as
        | LogisticsStatus
        | undefined;

      const result = await OrderService.getLogisticsProviderOrders(
        userId,
        logisticsStatus,
        page,
        limit,
      );

      res.status(200).json({
        status: 'success',
        results: result.orders.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        data: { orders: result.orders },
      });
    } catch (error) {
      next(error);
    }
  };

  static acceptLogisticsOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return next(new CustomError('User not authenticated', 401, 'fail'));
      }

      const orderId = extractParam(req, 'orderId');
      if (!orderId) {
        return next(new CustomError('Order ID is required', 400, 'fail'));
      }

      const order = await OrderService.acceptLogisticsOrder(orderId, userId);
      res.status(200).json({
        status: 'success',
        message: 'Order accepted',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  static rejectLogisticsOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return next(new CustomError('User not authenticated', 401, 'fail'));
      }

      const orderId = extractParam(req, 'orderId');
      if (!orderId) {
        return next(new CustomError('Order ID is required', 400, 'fail'));
      }

      const order = await OrderService.rejectLogisticsOrder(
        orderId,
        userId,
        req.body.reason,
      );
      res.status(200).json({
        status: 'success',
        message: 'Order declined',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  static shipOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return next(new CustomError('User not authenticated', 401, 'fail'));
      }

      const orderId = extractParam(req, 'orderId');
      if (!orderId) {
        return next(new CustomError('Order ID is required', 400, 'fail'));
      }

      const order = await OrderService.shipOrder(orderId, userId, {
        trackingNumber: req.body.trackingNumber,
        expectedDeliveryDate: req.body.expectedDeliveryDate,
        notes: req.body.notes,
      });
      res.status(200).json({
        status: 'success',
        message: 'Order marked as shipped',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };
}
