import { NextFunction, Request, Response } from 'express';
import { RiderService } from '../services/riderService';
import { getRouteParam } from '../utils/getRouteParam';

export class RiderController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const rider = await RiderService.register(req.body);
      res.status(201).json({ status: 'success', data: rider });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await RiderService.login(email, password);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await RiderService.verifyLoginOtp(email, code);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await RiderService.getAvailableRiders(page, limit);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rider = await RiderService.getRiderById(getRouteParam(req.params.riderId));
      res.status(200).json({ status: 'success', data: rider });
    } catch (error) {
      next(error);
    }
  }
}
