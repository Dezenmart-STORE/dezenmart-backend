import { Request, Response } from 'express';
import logisticsService from '../services/logisticsService';
import LogisticsProvider from '../models/logisticsModel';
import { PricingRule } from '../models/pricingRuleModel';
import { Delivery } from '../models/deliveryModel';
import { NigeriaLocation } from '../models/nigeriaLocationModel';

// ============ CUSTOMER ENDPOINTS ============

/**
 * Custom request type for authenticated routes
 */
export interface AuthRequest extends Omit<Request, 'user'> {
  user?: {
    id: string;
    providerId?: string;
  };
}

/**
 * Get available logistics providers for checkout
 */
export const getAvailableProviders = async (req: Request, res: Response) => {
  try {
    const { fromState, fromLGA, toState, toLGA, weight } = req.body;

    if (!fromState || !fromLGA || !toState || !toLGA || !weight) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: fromState, fromLGA, toState, toLGA, weight',
      });
    }

    if (weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be greater than 0',
      });
    }

    const result = await logisticsService.getAvailableProviders({
      fromState,
      fromLGA,
      toState,
      toLGA,
      weight: Number(weight),
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create delivery order
 */
export const createDelivery = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      providerId,
      pickupAddress,
      deliveryAddress,
      packageDetails,
      ruleId,
    } = req.body;

    if (
      !orderId ||
      !providerId ||
      !pickupAddress ||
      !deliveryAddress ||
      !packageDetails ||
      !ruleId
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const customerId = req.user?.id;
    if (!customerId)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await logisticsService.createDelivery({
      orderId,
      providerId,
      customerId: customerId as any,
      pickupAddress,
      deliveryAddress,
      packageDetails,
      ruleId,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Track delivery
 */
export const trackDelivery = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;
    const result = await logisticsService.trackDelivery(trackingNumber);

    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get customer deliveries
 */
export const getMyDeliveries = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { customerId };
    if (status) query.status = status;

    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .populate('providerId', 'name phone email')
        .sort({ createdAt: -1 })
        .limit(l)
        .skip((p - 1) * l),
      Delivery.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: deliveries,
      pagination: { total, page: p, pages: Math.ceil(total / l) },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============ PROVIDER ENDPOINTS ============

/**
 * Provider registration/onboarding
 */
export const registerProvider = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, walletAddress, coverageAreas } = req.body;

    if (!name || !email || !phone || !walletAddress || !coverageAreas) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const existingProvider = await LogisticsProvider.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Provider with this email or wallet address already exists',
      });
    }

    const provider = new LogisticsProvider({
      name,
      email,
      phone,
      walletAddress,
      coverageAreas,
    });
    await provider.save();

    return res.status(201).json({
      success: true,
      message: 'Provider registered successfully. Awaiting verification.',
      data: provider,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add pricing rule
 */
export const addPricingRule = async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user?.providerId;
    if (!providerId)
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized as provider' });

    const {
      deliveryType,
      fromState,
      fromLGA,
      toState,
      toLGA,
      weightTiers,
      insuranceFee,
      packagingFee,
      estimatedDays,
    } = req.body;

    if (!deliveryType || !fromState || !toState || !weightTiers?.length) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    if (
      ['intra_lga', 'inter_lga_same_state'].includes(deliveryType) &&
      (!fromLGA || !toLGA)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'LGA information required' });
    }

    const pricingRule = new PricingRule({
      providerId: providerId as any,
      deliveryType,
      fromState,
      fromLGA,
      toState,
      toLGA,
      weightTiers,
      insuranceFee: insuranceFee || 0,
      packagingFee: packagingFee || 0,
      estimatedDays,
    });

    await pricingRule.save();
    return res.status(201).json({
      success: true,
      message: 'Pricing rule added successfully',
      data: pricingRule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update pricing rule
 */
export const updatePricingRule = async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user?.providerId;
    const { ruleId } = req.params;

    const rule = await PricingRule.findOne({ _id: ruleId, providerId });
    if (!rule)
      return res
        .status(404)
        .json({ success: false, message: 'Pricing rule not found' });

    const allowedUpdates = [
      'weightTiers',
      'insuranceFee',
      'packagingFee',
      'estimatedDays',
      'isActive',
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (rule as any)[field] = req.body[field];
      }
    });

    await rule.save();
    return res.status(200).json({
      success: true,
      message: 'Pricing rule updated successfully',
      data: rule,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get provider's pricing rules
 */
export const getProviderPricingRules = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const providerId = req.user?.providerId;
    const rules = await PricingRule.find({ providerId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, data: rules });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update delivery status (Provider)
 */
export const updateDeliveryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user?.providerId;
    const { deliveryId } = req.params;
    const { status, transactionHash } = req.body;

    const delivery = await Delivery.findOne({ _id: deliveryId, providerId });
    if (!delivery)
      return res
        .status(404)
        .json({ success: false, message: 'Delivery not found' });

    const result = await logisticsService.updateDeliveryStatus(
      deliveryId,
      status,
      transactionHash,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all Nigerian locations
 */
export const getNigeriaLocations = async (_req: Request, res: Response) => {
  try {
    const locations = await NigeriaLocation.find().sort({ state: 1 });
    return res.status(200).json({ success: true, data: locations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
