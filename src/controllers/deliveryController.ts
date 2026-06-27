import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../middlewares/errorHandler';
import { IUser, Role } from '../models/userModel';
import { DeliveryService } from '../services/deliveryService';
import { DeliveryStatus } from '../models/deliveryModel';

type AuthRequest = Request & { user?: IUser };

function getUserId(req: AuthRequest): string {
  const id = (req.user as any)?._id?.toString() ?? (req.user as any)?.id;
  if (!id) {
    throw new CustomError('User not authenticated', 401, 'fail');
  }
  return id;
}

function getUserRoles(req: AuthRequest): Role[] {
  return (req.user?.roles as Role[]) ?? [Role.USER];
}

function extractId(req: Request, param = 'id'): string {
  const value = req.params[param];
  return Array.isArray(value) ? value[0] : value;
}

export class DeliveryController {
  static create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const delivery = await DeliveryService.createDelivery(userId, req.body);
      res.status(201).json({ status: 'success', data: { delivery } });
    } catch (error) {
      next(error);
    }
  };

  static list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const roles = getUserRoles(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as DeliveryStatus | undefined;

      const result = await DeliveryService.getDeliveries(userId, roles, page, limit, status);
      res.status(200).json({
        status: 'success',
        results: result.deliveries.length,
        total: result.total,
        data: { deliveries: result.deliveries },
      });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const roles = getUserRoles(req);
      const id = extractId(req);
      const delivery = await DeliveryService.getDeliveryById(userId, roles, id);
      res.status(200).json({ status: 'success', data: { delivery } });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const roles = getUserRoles(req);
      const id = extractId(req);
      const delivery = await DeliveryService.updateDelivery(userId, roles, id, req.body);
      res.status(200).json({ status: 'success', data: { delivery } });
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const roles = getUserRoles(req);
      const id = extractId(req);
      await DeliveryService.deleteDelivery(userId, roles, id);
      res.status(200).json({ status: 'success', message: 'Delivery cancelled' });
    } catch (error) {
      next(error);
    }
  };
}
