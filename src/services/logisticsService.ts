import { FilterQuery, Types } from 'mongoose';
import LogisticsProvider, {
  ILogisticsProvider,
} from '../models/logisticsModel';
import { PricingRule, IPricingRule, IWeightTier } from '../models/pricingRuleModel';
import { Delivery, IDelivery, DeliveryStatus } from '../models/deliveryModel';

// Define the shape of the available provider options returned to the frontend
interface ProviderOption {
  providerId: Types.ObjectId;
  providerName: string;
  providerContact: {
    email: string;
    phone: string;
  };
  rating: number;
  totalDeliveries: number;
  deliveryType: IPricingRule['deliveryType'];
  pricing: {
    basePrice: number;
    insuranceFee: number;
    packagingFee: number;
    totalPrice: number;
    currency: string;
  };
  estimatedDays?: IPricingRule['estimatedDays'];
  weightTier: {
    minWeight: number;
    maxWeight: number;
  };
  ruleId: Types.ObjectId;
}

class LogisticsService {
  /**
   * Determine delivery type based on pickup and delivery locations
   */
  public determineDeliveryType(
    fromState: string,
    fromLGA: string,
    toState: string,
    toLGA: string,
  ): IPricingRule['deliveryType'] {
    if (fromState === toState && fromLGA === toLGA) {
      return 'intra_lga';
    } else if (fromState === toState && fromLGA !== toLGA) {
      return 'inter_lga_same_state';
    } else {
      return 'inter_state';
    }
  }

  /**
   * Get available logistics providers and their prices for a route
   */
  async getAvailableProviders(params: {
    fromState: string;
    fromLGA: string;
    toState: string;
    toLGA: string;
    weight: number;
  }) {
    try {
      const { fromState, fromLGA, toState, toLGA, weight } = params;
      const deliveryType = this.determineDeliveryType(
        fromState,
        fromLGA,
        toState,
        toLGA,
      );

      // 1. Find providers covering these locations
      const providers = await this.findCoveringProviders(
        fromState,
        fromLGA,
        toState,
        toLGA,
      );

      if (providers.length === 0) {
        return {
          success: false,
          message: 'No logistics providers available for this route',
          data: [],
        };
      }

      const providerIds = providers.map((p) => p._id);

      // 2. Build pricing query
      const pricingQuery: FilterQuery<IPricingRule> = {
        providerId: { $in: providerIds },
        deliveryType: deliveryType,
        isActive: true,
      };

      if (
        deliveryType === 'intra_lga' ||
        deliveryType === 'inter_lga_same_state'
      ) {
        pricingQuery.$or = [
          { fromState, fromLGA, toState, toLGA },
          {
            fromState,
            toState,
            fromLGA: { $exists: false },
            toLGA: { $exists: false },
          },
        ];
      } else {
        pricingQuery.fromState = fromState;
        pricingQuery.toState = toState;
      }

      // Populate provider info from the PricingRule
      const pricingRules = await PricingRule.find(pricingQuery).populate<{
        providerId: ILogisticsProvider;
      }>('providerId');

      const availableOptions: ProviderOption[] = [];

      for (const rule of pricingRules) {
        const pricingResult = this.calculatePrice(rule, weight);

        if (pricingResult) {
          const provider = rule.providerId; // Populated

          availableOptions.push({
            providerId: provider._id as Types.ObjectId,
            providerName: provider.name,
            providerContact: {
              email: provider.email,
              phone: provider.phone,
            },
            rating: provider.rating,
            totalDeliveries: provider.totalDeliveries,
            deliveryType: deliveryType,
            pricing: {
              basePrice: pricingResult.price,
              insuranceFee: rule.insuranceFee,
              packagingFee: rule.packagingFee,
              totalPrice:
                pricingResult.price + rule.insuranceFee + rule.packagingFee,
              currency: 'NGN',
            },
            estimatedDays: rule.estimatedDays,
            weightTier: pricingResult.tier,
            ruleId: rule._id as Types.ObjectId,
          });
        }
      }

      // Sort: Cheapest first, then highest rating
      availableOptions.sort((a, b) => {
        if (a.pricing.totalPrice !== b.pricing.totalPrice) {
          return a.pricing.totalPrice - b.pricing.totalPrice;
        }
        return b.rating - a.rating;
      });

      return {
        success: true,
        data: availableOptions,
        deliveryType,
      };
    } catch (error: any) {
      throw new Error(`Error fetching providers: ${error.message}`);
    }
  }

  /**
   * Find providers that cover the specified route
   */
  async findCoveringProviders(
    fromState: string,
    fromLGA: string,
    toState: string,
    toLGA: string,
  ): Promise<ILogisticsProvider[]> {
    const providers = await LogisticsProvider.find({
      isActive: true,
      verificationStatus: 'verified',
    });

    return providers.filter((provider) => {
      const coversPickup = this.providerCoversLocation(
        provider,
        fromState,
        fromLGA,
      );
      const coversDelivery = this.providerCoversLocation(
        provider,
        toState,
        toLGA,
      );
      return coversPickup && coversDelivery;
    });
  }

  /**
   * Check if provider covers a specific location
   */
  private providerCoversLocation(
    provider: ILogisticsProvider,
    state: string,
    lga: string,
  ): boolean {
    const coverageArea = provider.coverageAreas.find(
      (area) => area.state === state,
    );

    if (!coverageArea) return false;
    if (coverageArea.isStatewide) return true;

    return coverageArea.lgas.includes(lga);
  }

  /**
   * Calculate price based on weight tiers
   */
  public calculatePrice(pricingRule: IPricingRule, weight: number) {
    const tier = pricingRule.weightTiers.find(
      (t: IWeightTier) => weight >= t.minWeight && weight <= t.maxWeight,
    );

    if (!tier) return null;

    return {
      price: tier.price,
      tier: {
        minWeight: tier.minWeight,
        maxWeight: tier.maxWeight,
      },
    };
  }

  /**
   * Create a delivery order
   */
  async createDelivery(deliveryData: Partial<IDelivery> & { ruleId: string }) {
    try {
      const {
        orderId,
        providerId,
        customerId,
        pickupAddress,
        deliveryAddress,
        packageDetails,
        ruleId,
      } = deliveryData;

      if (!pickupAddress || !deliveryAddress || !packageDetails) {
        throw new Error('Missing delivery address or package details');
      }

      const provider = await LogisticsProvider.findById(providerId);
      if (
        !provider ||
        !provider.isActive ||
        provider.verificationStatus !== 'verified'
      ) {
        throw new Error('Invalid or inactive logistics provider');
      }

      const rule = await PricingRule.findById(ruleId);
      if (!rule || !rule.isActive) {
        throw new Error('Invalid or inactive pricing rule');
      }

      const deliveryType = this.determineDeliveryType(
        pickupAddress.state,
        pickupAddress.lga,
        deliveryAddress.state,
        deliveryAddress.lga,
      );

      const pricingResult = this.calculatePrice(rule, packageDetails.weight);
      if (!pricingResult) {
        throw new Error('Package weight exceeds provider limits');
      }

      const totalPrice =
        pricingResult.price + rule.insuranceFee + rule.packagingFee;
      const trackingNumber = this.generateTrackingNumber();

      const estimatedDeliveryDate = new Date();
      estimatedDeliveryDate.setDate(
        estimatedDeliveryDate.getDate() + (rule.estimatedDays?.max || 7),
      );

      const delivery = new Delivery({
        orderId,
        providerId,
        customerId,
        pickupAddress,
        deliveryAddress,
        deliveryType,
        packageDetails,
        pricing: {
          basePrice: pricingResult.price,
          insuranceFee: rule.insuranceFee,
          packagingFee: rule.packagingFee,
          totalPrice: totalPrice,
          currency: 'NGN',
        },
        trackingNumber,
        estimatedDeliveryDate,
        status: 'pending',
        paymentStatus: 'pending',
      });

      await delivery.save();

      return {
        success: true,
        data: delivery,
      };
    } catch (error: any) {
      throw new Error(`Error creating delivery: ${error.message}`);
    }
  }

  public generateTrackingNumber(): string {
    const prefix = 'NG';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    transactionHash: string | null = null,
  ) {
    try {
      const updateData: any = { status };

      if (status === 'delivered') {
        updateData.actualDeliveryDate = new Date();
      }

      if (transactionHash) {
        updateData.transactionHash = transactionHash;
        updateData.paymentStatus = 'paid';
      }

      const delivery = await Delivery.findByIdAndUpdate(
        deliveryId,
        updateData,
        { new: true },
      ).populate('providerId customerId');

      if (!delivery) throw new Error('Delivery not found');

      if (status === 'delivered') {
        await LogisticsProvider.findByIdAndUpdate(delivery.providerId, {
          $inc: { totalDeliveries: 1 },
        });
      }

      return {
        success: true,
        data: delivery,
      };
    } catch (error: any) {
      throw new Error(`Error updating delivery status: ${error.message}`);
    }
  }

  async trackDelivery(trackingNumber: string) {
    try {
      const delivery = await Delivery.findOne({ trackingNumber })
        .populate('providerId', 'name phone email')
        .populate('customerId', 'name email phone');

      if (!delivery) {
        return {
          success: false,
          message: 'Delivery not found',
        };
      }

      return {
        success: true,
        data: delivery,
      };
    } catch (error: any) {
      throw new Error(`Error tracking delivery: ${error.message}`);
    }
  }
}

export default new LogisticsService();
