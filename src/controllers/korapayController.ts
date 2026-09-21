import { NextFunction, Request, Response } from 'express';
import { KorapayService } from '../services/korapayService';
import { getRouteParam } from '../utils/getRouteParam';

export class KorapayController {
  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await KorapayService.initiateCharge(req.body.bookingRef);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await KorapayService.verifyTransaction(getRouteParam(req.params.reference));
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['x-korapay-signature'] as string | undefined;
      await KorapayService.handleWebhook(rawBody, signature, req.body);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }
}
