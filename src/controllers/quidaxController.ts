import { NextFunction, Request, Response } from 'express';
import { IUser } from '../models/userModel';
import { QuidaxService } from '../services/quidaxService';

type AuthRequest = Request & { user?: IUser };

function getMerchantRef(req: Request): string {
  const ref = req.params.merchantRef;
  return Array.isArray(ref) ? ref[0] : ref;
}

export class QuidaxController {
  // ── On-Ramp ───────────────────────────────────────────────────────────────

  static async initiateOnRamp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?._id?.toString() ?? (req.user as any)?.id;
      const result = await QuidaxService.initiateOnRamp(userId, req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirmOnRamp(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const data = await QuidaxService.confirmOnRamp(ref);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async refreshOnRamp(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const data = await QuidaxService.refreshOnRamp(ref, req.body);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async fetchOnRampTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const data = await QuidaxService.fetchOnRampTransaction(ref);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // ── Off-Ramp ──────────────────────────────────────────────────────────────

  static async initiateOffRamp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)?._id?.toString() ?? (req.user as any)?.id;
      const result = await QuidaxService.initiateOffRamp(userId, req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirmOffRamp(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const data = await QuidaxService.confirmOffRamp(ref);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const { bank_code, account_number } = req.body;
      const data = await QuidaxService.addBankAccountToOffRamp(ref, bank_code, account_number);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  static async fetchOffRampTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const ref = getMerchantRef(req);
      const data = await QuidaxService.fetchOffRampTransaction(ref);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // ── Banks ─────────────────────────────────────────────────────────────────

  static async getBanks(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuidaxService.getBanks();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  // ── Webhook ───────────────────────────────────────────────────────────────

  static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Re-stringify parsed body for HMAC verification.
      // If Quidax signs a different payload format, update this accordingly.
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['x-quidax-signature'] as string | undefined;
      await QuidaxService.handleWebhook(rawBody, signature, req.body);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }
}
