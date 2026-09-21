import { NextFunction, Request, Response } from 'express';
import { IRider } from '../models/riderModel';
import { RiderBookingService } from '../services/riderBookingService';
import { getRouteParam } from '../utils/getRouteParam';

type RiderAuthRequest = Request & { rider?: IRider };

function getRiderId(req: RiderAuthRequest): string {
  return (req.rider as any)._id.toString();
}

export class RiderBookingController {
  static async getRequests(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await RiderBookingService.getRequests(getRiderId(req), page, limit);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async accept(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await RiderBookingService.acceptRequest(
        getRouteParam(req.params.id),
        getRiderId(req),
      );
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RiderBookingService.rejectRequest(
        getRouteParam(req.params.id),
        getRiderId(req),
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await RiderBookingService.updateStatus(
        getRouteParam(req.params.id),
        getRiderId(req),
        req.body.status,
      );
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: RiderAuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await RiderBookingService.verifyCompletionOtp(
        getRouteParam(req.params.id),
        getRiderId(req),
        req.body.code,
      );
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }
}
