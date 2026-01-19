import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { CustomError } from '../middlewares/errorHandler';

export class OrderController {
  static createOrder = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }
    const order = await OrderService.createOrder({
      product: req.body.product,
      buyer: req.user.id,
      logisticsProviderWalletAddress: req.body.logisticsProviderWalletAddress,
      quantity: req.body.quantity,
    });
    res.status(201).json(order);
  };

  static getOrders = async (req: Request, res: Response) => {
    const orders = await OrderService.getOrders();
    res.json(orders);
  };

  static getOrderDetails = async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.getOrderById(id);
    res.json(order);
  };

  static updateOrder = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.updateOrder(
      id,
      req.body,
      req.user.id,
    );
    res.json(order);
  };

  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return new CustomError('User not authenticated', 401, 'fail');
      }

      const userType = req.query.type as string;
      if (userType !== 'buyer' && userType !== 'seller') {
        return res.status(400).json({
          status: 'fail',
          message:
            'Invalid user type specified. Query parameter "type" must be "buyer" or "seller".',
        });
      }

      const orders = await OrderService.getUserOrders(
        userId,
        userType as 'buyer' | 'seller',
      );
      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
          orders,
        },
      });
    } catch (error) {
      const err = error as { status?: number; message?: string };
      err.status = err.status || 500;
      err.message = err.message || 'Internal Server Error';
      res.status(err.status).json({
        status: 'fail',
        message: err.message,
      });
    }
  }

  static raiseDispute = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'fail',
        message: 'User not authenticated',
      });
    }
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    const order = await OrderService.raiseDispute(
      id,
      req.user.id,
      req.body.reason,
    );
    res.json(order);
  };
}
