import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';

export class OrderController {
  static createOrder = async (req: Request, res: Response) => {
    const order = await OrderService.createOrder({
      product: req.body.product,
      buyer: req.user.id,
      logisticsProviderWalletAddress: req.body.logisticsProviderWalletAddress,
      quantity: req.body.quantity,
    });
    res.status(201).json(order);
  };

  static getOrderDetails = async (req: Request, res: Response) => {
    const order = await OrderService.getOrderById(req.params.id);
    res.json(order);
  };

  static updateOrderStatus = async (req: Request, res: Response) => {
    const order = await OrderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user.id,
    );
    res.json(order);
  };

  static getUserOrders = async (req: Request, res: Response) => {
    const orders = await OrderService.getUserOrders(
      req.user.id,
      req.query.type as 'buyer' | 'seller',
    );
    res.json(orders);
  };

  static raiseDispute = async (req: Request, res: Response) => {
    const order = await OrderService.raiseDispute(
      req.params.id,
      req.user.id,
      req.body.reason,
    );
    res.json(order);
  };
}
