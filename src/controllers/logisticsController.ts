import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../middlewares/errorHandler';
import { IUser } from '../models/userModel';
import { LogisticsService } from '../services/logisticsService';

type AuthRequest = Request & { user?: IUser };


function extractId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

function getUserId(req: AuthRequest, next: NextFunction): string | null {
  const id = (req.user as any)?._id?.toString() ?? (req.user as any)?.id;
  if (!id) {
    next(new CustomError('User not authenticated.', 401, 'fail'));
    return null;
  }
  return id;
}

// ── legacy CRUD (preserved for backward compat) ───────────────────────────────

export class LogisticsController {
  static async createLogistics(req: Request, res: Response, next: NextFunction) {
    try {
      const logisticsProvider = await LogisticsService.createLogistics(req.body);
      res.status(201).json({ status: 'success', data: { logisticsProvider } });
    } catch (error) {
      next(error);
    }
  }

  static async getAllLogistics(req: Request, res: Response, next: NextFunction) {
    try {
      const logisticsProviders = await LogisticsService.getAllLogistics();
      res.status(200).json({
        status: 'success',
        results: logisticsProviders.length,
        data: { logisticsProviders },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogisticsById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = extractId(req);
      if (!id) return next(new CustomError('No logistics provider ID provided', 400, 'fail'));

      const logisticsProvider = await LogisticsService.getLogisticsById(id);
      if (!logisticsProvider) {
        return next(new CustomError('No logistics provider found with that ID', 404, 'fail'));
      }

      res.status(200).json({ status: 'success', data: { logisticsProvider } });
    } catch (error) {
      next(error);
    }
  }

  static async updateLogistics(req: Request, res: Response, next: NextFunction) {
    try {
      const id = extractId(req);
      if (!id) return next(new CustomError('No logistics provider ID provided', 400, 'fail'));

      const logisticsProvider = await LogisticsService.updateLogistics(id, req.body);
      if (!logisticsProvider) {
        return next(new CustomError('No logistics provider found with that ID', 404, 'fail'));
      }

      res.status(200).json({ status: 'success', data: { logisticsProvider } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLogistics(req: Request, res: Response, next: NextFunction) {
    try {
      const id = extractId(req);
      if (!id) return next(new CustomError('No logistics provider ID provided', 400, 'fail'));

      const logisticsProvider = await LogisticsService.deleteLogistics(id);
      if (!logisticsProvider) {
        return next(new CustomError('No logistics provider found with that ID', 404, 'fail'));
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ── provider profile ──────────────────────────────────────────────────────

  static async onboardMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const provider = await LogisticsService.createProviderForUser(userId, req.body);
      res.status(201).json({ status: 'success', data: { provider } });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const provider = await LogisticsService.getProviderByUserId(userId);
      if (!provider) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      res.status(200).json({ status: 'success', data: { provider } });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const existing = await LogisticsService.getProviderByUserId(userId);
      if (!existing) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      const provider = await LogisticsService.updateProvider(String(existing._id), req.body);
      res.status(200).json({ status: 'success', data: { provider } });
    } catch (error) {
      next(error);
    }
  }

  static async getAllProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationStatus, isActive, page, limit } = req.query as Record<string, string>;
      const { providers, total } = await LogisticsService.getAllProviders({
        verificationStatus,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({
        status: 'success',
        results: providers.length,
        total,
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProviderById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = extractId(req);
      if (!id) return next(new CustomError('No provider ID provided.', 400, 'fail'));

      const provider = await LogisticsService.getProviderById(id);
      if (!provider) return next(new CustomError('Provider not found.', 404, 'fail'));

      res.status(200).json({ status: 'success', data: { provider } });
    } catch (error) {
      next(error);
    }
  }

  static async verifyProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const id = extractId(req);
      if (!id) return next(new CustomError('No provider ID provided.', 400, 'fail'));

      const { status } = req.body as { status: 'verified' | 'rejected' };
      if (!['verified', 'rejected'].includes(status)) {
        return next(new CustomError('Status must be "verified" or "rejected".', 400, 'fail'));
      }

      const provider = await LogisticsService.verifyProvider(id, status);
      if (!provider) return next(new CustomError('Provider not found.', 404, 'fail'));

      res.status(200).json({ status: 'success', data: { provider } });
    } catch (error) {
      next(error);
    }
  }

  // ── pricing rules ─────────────────────────────────────────────────────────

  static async createPricingRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const existing = await LogisticsService.getProviderByUserId(userId);
      if (!existing) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      const rule = await LogisticsService.createPricingRule(String(existing._id), req.body);
      res.status(201).json({ status: 'success', data: { rule } });
    } catch (error) {
      next(error);
    }
  }

  static async getPricingRules(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deliveryType, providerId, userId: queryUserId } = req.query as {
        deliveryType?: string;
        providerId?: string;
        userId?: string;
      };

      let resolvedProviderId = providerId || queryUserId || getUserId(req, next);
      if (!resolvedProviderId) {
        return next(new CustomError('Provider identifier is required.', 400, 'fail'));
      }

      const provider = await LogisticsService.getProviderById(resolvedProviderId);
      if (!provider) {
        const providerByUserId = await LogisticsService.getProviderByUserId(resolvedProviderId);
        if (!providerByUserId) {
          return next(new CustomError('Provider profile not found.', 404, 'fail'));
        }
        resolvedProviderId = String(providerByUserId._id);
      }

      const rules = await LogisticsService.getPricingRules(
        String(resolvedProviderId),
        deliveryType as any,
      );
      res.status(200).json({ status: 'success', results: rules.length, data: { rules } });
    } catch (error) {
      next(error);
    }
  }

  static async updatePricingRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const existing = await LogisticsService.getProviderByUserId(userId);
      if (!existing) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
      const rule = await LogisticsService.updatePricingRule(String(existing._id), ruleId, req.body);
      res.status(200).json({ status: 'success', data: { rule } });
    } catch (error) {
      next(error);
    }
  }

  static async deletePricingRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const existing = await LogisticsService.getProviderByUserId(userId);
      if (!existing) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
      await LogisticsService.deletePricingRule(String(existing._id), ruleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async togglePricingRule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const existing = await LogisticsService.getProviderByUserId(userId);
      if (!existing) return next(new CustomError('Provider profile not found.', 404, 'fail'));

      const ruleId = Array.isArray(req.params.ruleId) ? req.params.ruleId[0] : req.params.ruleId;
      const rule = await LogisticsService.togglePricingRule(String(existing._id), ruleId);
      res.status(200).json({ status: 'success', data: { rule } });
    } catch (error) {
      next(error);
    }
  }

  // ── customer-facing ───────────────────────────────────────────────────────

  static async getProvidersByDeliveryAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const { deliveryAddressId, fromState, fromLga, weight, sort } = req.query as Record<string, string>;

      const providers = await LogisticsService.getProvidersByDeliveryAddress({
        buyerId: userId,
        deliveryAddressId,
        fromState,
        fromLga,
        weight: Number(weight),
        sort: sort as any,
      });

      res.status(200).json({
        status: 'success',
        results: providers.length,
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createQuote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req, next);
      if (!userId) return;

      const { deliveryAddressId, fromState, fromLga, toState, toLga, weight } = req.body as {
        deliveryAddressId: string;
        fromState: string;
        fromLga: string;
        toState: string;
        toLga: string;
        weight: number;
      };

      const quote = await LogisticsService.createQuote({
        buyerId: userId,
        deliveryAddressId,
        fromState,
        fromLga,
        toState,
        toLga,
        weight,
      });

      res.status(201).json({ status: 'success', data: quote });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromState, fromLga, toState, toLga, weight, sort } = req.query as Record<string, string>;

      const providers = await LogisticsService.getAvailableProviders({
        fromState,
        fromLga,
        toState,
        toLga,
        weight: Number(weight),
        sort: sort as any,
      });

      res.status(200).json({
        status: 'success',
        results: providers.length,
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── location reference ────────────────────────────────────────────────────

  static async getStates(req: Request, res: Response, next: NextFunction) {
    try {
      const states = LogisticsService.getNigeriaStates();
      res.status(200).json({ status: 'success', results: states.length, data: { states } });
    } catch (error) {
      next(error);
    }
  }

  static async getLgas(req: Request, res: Response, next: NextFunction) {
    try {
      const state = Array.isArray(req.params.state) ? req.params.state[0] : req.params.state;
      const lgas = LogisticsService.getNigeriaLgas(state);
      res.status(200).json({ status: 'success', results: lgas.length, data: { lgas } });
    } catch (error) {
      next(error);
    }
  }
}
