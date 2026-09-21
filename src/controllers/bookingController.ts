import { NextFunction, Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { getRouteParam } from '../utils/getRouteParam';

export class BookingController {
  static async bookRide(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.bookRide(req.body);
      res.status(201).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async bookDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.bookDelivery(req.body);
      res.status(201).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async findOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone } = req.query as { email?: string; phone?: string };
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await BookingService.findOrders({ email, phone }, page, limit);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getByBookingRef(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.findByBookingRef(getRouteParam(req.params.bookingRef));
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await BookingService.getStatus(getRouteParam(req.params.bookingRef));
      res.status(200).json({ status: 'success', data: status });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await BookingService.cancelBooking(
        getRouteParam(req.params.bookingRef),
        req.body?.reason,
      );
      res.status(200).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  }
}
