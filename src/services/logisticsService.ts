import jwt from 'jsonwebtoken';
import { Address } from 'viem';
import config from '../configs/config';
import { getStateNames, getLgasByState } from '../data/nigeriaLocations';
import { CustomError } from '../middlewares/errorHandler';
import { ILogistics, Logistics } from '../models/logisticsModel';
import { IPricingRule, PricingRule, DeliveryType } from '../models/pricingRuleModel';
import { Role, User } from '../models/userModel';
import { contractService } from '../server';

// ─── helpers ─────────────────────────────────────────────────────────────────

function signToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, config.JWT_SECRET!, { expiresIn: '7d' });
}

function isValidWalletAddress(walletAddress: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
}

function determineDeliveryType(
  fromState: string,
  fromLga: string,
  toState: string,
  toLga: string,
): DeliveryType {
  if (fromState.toLowerCase() === toState.toLowerCase()) {
    if (fromLga.toLowerCase() === toLga.toLowerCase()) return 'intra_lga';
    return 'inter_lga_same_state';
  }
  return 'inter_state';
}

function providerCoversLocation(
  provider: ILogistics,
  state: string,
  lga: string,
): boolean {
  return provider.coverageAreas.some(
    (area) =>
      area.state.toLowerCase() === state.toLowerCase() &&
      (area.isStatewide || area.lgas.some((l) => l.toLowerCase() === lga.toLowerCase())),
  );
}

// ─── interfaces ───────────────────────────────────────────────────────────────

export interface IGoogleProviderOnboardingInput {
  name: string;
  phone: string;
  walletAddress: string;
  coverageAreas?: Array<{ state: string; lgas: string[]; isStatewide: boolean }>;
}

export interface IUpdateProviderInput {
  name?: string;
  phone?: string;
  coverageAreas?: Array<{ state: string; lgas: string[]; isStatewide: boolean }>;
  isActive?: boolean;
}

export interface ICreatePricingRuleInput {
  deliveryType: DeliveryType;
  fromState: string;
  fromLga?: string;
  toState: string;
  toLga?: string;
  weightTiers: Array<{ minWeight: number; maxWeight: number; price: number }>;
  insuranceFee?: number;
  packagingFee?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface IAvailableProvider {
  provider: ILogistics;
  pricingRule: IPricingRule;
  breakdown: {
    basePrice: number;
    insuranceFee: number;
    packagingFee: number;
    totalPrice: number;
  };
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

// ─── service ──────────────────────────────────────────────────────────────────

export class LogisticsService {
  // ── legacy CRUD (preserved for backward compat) ──────────────────────────

  static async createLogistics(logisticsInput: {
    name: string;
    walletAddress: string;
  }): Promise<ILogistics> {
    const { name, walletAddress } = logisticsInput;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new CustomError('Logistics provider name is required.', 400, 'fail');
    }
    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
      throw new CustomError('A valid wallet address (starting with "0x") is required.', 400, 'fail');
    }

    const existingLogistics = await Logistics.findOne({ $or: [{ name }, { walletAddress }] });
    if (existingLogistics) {
      throw new CustomError('A logistics provider with this name or wallet address already exists.', 409, 'fail');
    }

    const record = await new Logistics({ name, walletAddress }).save();

    contractService.registerLogisticsProvider(walletAddress as Address).catch((err: unknown) => {
      console.error('[logistics] on-chain registration failed for', walletAddress, err);
    });

    return record;
  }

  static async getAllLogistics(): Promise<ILogistics[]> {
    return await Logistics.find();
  }

  static async getLogisticsById(id: string): Promise<ILogistics | null> {
    return await Logistics.findById(id);
  }

  static async updateLogistics(
    id: string,
    logisticsData: Partial<ILogistics>,
  ): Promise<ILogistics | null> {
    return await Logistics.findByIdAndUpdate(id, logisticsData, { new: true });
  }

  static async deleteLogistics(id: string): Promise<ILogistics | null> {
    return await Logistics.findByIdAndDelete(id);
  }

  // ── auth ─────────────────────────────────────────────────────────────────

  static async findOrCreateGoogleProvider(
    profile: any,
  ): Promise<{
    user: any;
    provider: ILogistics | null;
    token: string;
    needsOnboarding: boolean;
  }> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new CustomError('Google account email is required.', 400, 'fail');
    }

    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
      } else {
        user = new User({
          googleId: profile.id,
          email,
          name: profile.displayName,
          profileImage: profile.photos?.[0]?.value,
        });
      }
    }

    const provider = await Logistics.findOne({ userId: user._id });

    if (provider && !user.roles?.includes(Role.LOGISTICS_AGENT)) {
      user.roles = [...(user.roles ?? []), Role.LOGISTICS_AGENT];
    }
    await user.save();

    const token = signToken(String(user._id), user.email);
    return { user, provider, token, needsOnboarding: !provider };
  }

  static async createProviderForUser(
    userId: string,
    input: IGoogleProviderOnboardingInput,
  ): Promise<ILogistics> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User associated with this token no longer exists.', 401, 'fail');
    }

    const existingForUser = await Logistics.findOne({ userId: user._id });
    if (existingForUser) {
      if (!user.roles?.includes(Role.LOGISTICS_AGENT)) {
        user.roles = [...(user.roles ?? []), Role.LOGISTICS_AGENT];
        await user.save();
      }
      return existingForUser;
    }

    const { name, phone, walletAddress, coverageAreas = [] } = input;

    if (!isValidWalletAddress(walletAddress)) {
      throw new CustomError('walletAddress must be a valid Ethereum address (0x...).', 400, 'fail');
    }

    const existingProvider = await Logistics.findOne({
      $or: [{ name }, { walletAddress }, { email: user.email }],
    });
    if (existingProvider) {
      throw new CustomError('A logistics provider with this name, email or wallet address already exists.', 409, 'fail');
    }

    const provider = await Logistics.create({
      userId: user._id,
      name,
      email: user.email,
      phone,
      walletAddress,
      coverageAreas,
    });

    if (!user.roles?.includes(Role.LOGISTICS_AGENT)) {
      user.roles = [...(user.roles ?? []), Role.LOGISTICS_AGENT];
      await user.save();
    }

    contractService.registerLogisticsProvider(walletAddress as Address).catch((err: unknown) => {
      console.error('[logistics] on-chain registration failed for', walletAddress, err);
    });

    return provider;
  }

  // ── provider profile ──────────────────────────────────────────────────────

  static async getProviderByUserId(userId: string): Promise<ILogistics | null> {
    return await Logistics.findOne({ userId });
  }

  static async updateProvider(
    providerId: string,
    data: IUpdateProviderInput,
  ): Promise<ILogistics | null> {
    return await Logistics.findByIdAndUpdate(
      providerId,
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  static async getAllProviders(filters: {
    verificationStatus?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ providers: ILogistics[]; total: number }> {
    const { verificationStatus, isActive, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (isActive !== undefined) query.isActive = isActive;

    const [providers, total] = await Promise.all([
      Logistics.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Logistics.countDocuments(query),
    ]);
    return { providers, total };
  }

  static async getProviderById(id: string): Promise<ILogistics | null> {
    return await Logistics.findById(id);
  }

  static async verifyProvider(
    providerId: string,
    status: 'verified' | 'rejected',
  ): Promise<ILogistics | null> {
    return await Logistics.findByIdAndUpdate(
      providerId,
      { verificationStatus: status },
      { new: true },
    );
  }

  // ── pricing rules ─────────────────────────────────────────────────────────

  static async createPricingRule(
    providerId: string,
    data: ICreatePricingRuleInput,
  ): Promise<IPricingRule> {
    if (data.weightTiers.length === 0) {
      throw new CustomError('At least one weight tier is required.', 400, 'fail');
    }

    // Validate no overlapping weight tiers
    const sorted = [...data.weightTiers].sort((a, b) => a.minWeight - b.minWeight);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].maxWeight > sorted[i + 1].minWeight) {
        throw new CustomError('Weight tiers must not overlap.', 400, 'fail');
      }
    }

    if (data.estimatedDaysMin > data.estimatedDaysMax) {
      throw new CustomError('estimatedDaysMin must be <= estimatedDaysMax.', 400, 'fail');
    }

    const existing = await PricingRule.findOne({
      providerId,
      deliveryType: data.deliveryType,
      fromState: data.fromState,
      fromLga: data.fromLga ?? null,
      toState: data.toState,
      toLga: data.toLga ?? null,
    });
    if (existing) {
      throw new CustomError('A pricing rule for this route already exists. Update the existing one.', 409, 'fail');
    }

    return await PricingRule.create({ providerId, ...data });
  }

  static async getPricingRules(
    providerId: string,
    deliveryType?: DeliveryType,
  ): Promise<IPricingRule[]> {
    const query: Record<string, unknown> = { providerId };
    if (deliveryType) query.deliveryType = deliveryType;
    return await PricingRule.find(query).sort({ createdAt: -1 });
  }

  static async updatePricingRule(
    providerId: string,
    ruleId: string,
    data: Partial<ICreatePricingRuleInput>,
  ): Promise<IPricingRule | null> {
    const rule = await PricingRule.findOne({ _id: ruleId, providerId });
    if (!rule) {
      throw new CustomError('Pricing rule not found or does not belong to this provider.', 404, 'fail');
    }

    if (data.weightTiers && data.weightTiers.length > 0) {
      const sorted = [...data.weightTiers].sort((a, b) => a.minWeight - b.minWeight);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].maxWeight > sorted[i + 1].minWeight) {
          throw new CustomError('Weight tiers must not overlap.', 400, 'fail');
        }
      }
    }

    return await PricingRule.findByIdAndUpdate(ruleId, { $set: data }, { new: true, runValidators: true });
  }

  static async deletePricingRule(
    providerId: string,
    ruleId: string,
  ): Promise<IPricingRule | null> {
    const rule = await PricingRule.findOneAndDelete({ _id: ruleId, providerId });
    if (!rule) {
      throw new CustomError('Pricing rule not found or does not belong to this provider.', 404, 'fail');
    }
    return rule;
  }

  static async togglePricingRule(
    providerId: string,
    ruleId: string,
  ): Promise<IPricingRule | null> {
    const rule = await PricingRule.findOne({ _id: ruleId, providerId });
    if (!rule) {
      throw new CustomError('Pricing rule not found or does not belong to this provider.', 404, 'fail');
    }
    rule.isActive = !rule.isActive;
    return await rule.save();
  }

  // ── customer-facing ───────────────────────────────────────────────────────

  static async getAvailableProviders(params: {
    fromState: string;
    fromLga: string;
    toState: string;
    toLga: string;
    weight: number;
    sort?: 'price' | 'days' | 'rating';
  }): Promise<IAvailableProvider[]> {
    const { fromState, fromLga, toState, toLga, weight, sort = 'price' } = params;
    const deliveryType = determineDeliveryType(fromState, fromLga, toState, toLga);

    // Find verified + active providers
    const providers = await Logistics.find({ verificationStatus: 'verified', isActive: true });

    const results: IAvailableProvider[] = [];

    for (const provider of providers) {
      const coversFrom = providerCoversLocation(provider, fromState, fromLga);
      const coversTo = providerCoversLocation(provider, toState, toLga);
      if (!coversFrom || !coversTo) continue;

      // Find matching active pricing rule for the route
      const rule = await PricingRule.findOne({
        providerId: provider._id,
        deliveryType,
        fromState: new RegExp(`^${fromState}$`, 'i'),
        toState: new RegExp(`^${toState}$`, 'i'),
        ...(deliveryType !== 'inter_state' && {
          fromLga: new RegExp(`^${fromLga}$`, 'i'),
          toLga: new RegExp(`^${toLga}$`, 'i'),
        }),
        isActive: true,
      });
      if (!rule) continue;

      // Find the matching weight tier
      const tier = rule.weightTiers.find(
        (t) => weight >= t.minWeight && weight <= t.maxWeight,
      );
      if (!tier) continue;

      const totalPrice = tier.price + rule.insuranceFee + rule.packagingFee;

      results.push({
        provider,
        pricingRule: rule,
        breakdown: {
          basePrice: tier.price,
          insuranceFee: rule.insuranceFee,
          packagingFee: rule.packagingFee,
          totalPrice,
        },
        estimatedDaysMin: rule.estimatedDaysMin,
        estimatedDaysMax: rule.estimatedDaysMax,
      });
    }

    // Sort results
    if (sort === 'price') {
      results.sort((a, b) => a.breakdown.totalPrice - b.breakdown.totalPrice);
    } else if (sort === 'days') {
      results.sort((a, b) => a.estimatedDaysMin - b.estimatedDaysMin);
    } else if (sort === 'rating') {
      results.sort((a, b) => b.provider.rating - a.provider.rating);
    }

    return results;
  }

  // ── location reference ────────────────────────────────────────────────────

  static getNigeriaStates(): string[] {
    return getStateNames();
  }

  static getNigeriaLgas(state: string): string[] {
    const lgas = getLgasByState(state);
    if (!lgas) {
      throw new CustomError(`State "${state}" not found.`, 404, 'fail');
    }
    return lgas;
  }
}
