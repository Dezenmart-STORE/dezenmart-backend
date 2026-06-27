import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../middlewares/errorHandler';
import { IUser, Role } from '../models/userModel';
import { DeliveryAddressService } from '../services/deliveryAddressService';

type AuthRequest = Request & { user?: IUser };

function getUserId(req: AuthRequest): string {
  const id = (req.user as any)?._id?.toString() ?? (req.user as any)?.id;
  if (!id) {
    throw new CustomError('User not authenticated', 401, 'fail');
  }
  return id;
}

function extractId(req: Request, param = 'id'): string {
  const value = req.params[param];
  return Array.isArray(value) ? value[0] : value;
}

export class DeliveryAddressController {
  static create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const address = await DeliveryAddressService.createAddress(userId, req.body);
      res.status(201).json({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  };

  static list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await DeliveryAddressService.getUserAddresses(userId, page, limit);
      res.status(200).json({
        status: 'success',
        results: result.addresses.length,
        total: result.total,
        data: { addresses: result.addresses },
      });
    } catch (error) {
      next(error);
    }
  };

  static getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = extractId(req);
      const address = await DeliveryAddressService.getAddressById(userId, id);
      res.status(200).json({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  };

  static update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = extractId(req);
      const address = await DeliveryAddressService.updateAddress(userId, id, req.body);
      res.status(200).json({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  };

  static setDefault = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = extractId(req);
      const address = await DeliveryAddressService.setDefaultAddress(userId, id);
      res.status(200).json({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  };

  static delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const id = extractId(req);
      await DeliveryAddressService.deleteAddress(userId, id);
      res.status(200).json({ status: 'success', message: 'Delivery address deleted' });
    } catch (error) {
      next(error);
    }
  };
}
