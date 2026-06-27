import { DeliveryAddress } from '../models/deliveryAddressModel';
import { CustomError } from '../middlewares/errorHandler';

export interface CreateDeliveryAddressInput {
  label: string;
  fullName: string;
  phone: string;
  country?: string;
  state: string;
  lga: string;
  street: string;
  zipCode?: string;
  isDefault?: boolean;
}

export interface UpdateDeliveryAddressInput {
  label?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  state?: string;
  lga?: string;
  street?: string;
  zipCode?: string;
  isDefault?: boolean;
}

export class DeliveryAddressService {
  private static async clearDefaultForUser(userId: string) {
    await DeliveryAddress.updateMany({ user: userId, isDefault: true }, { isDefault: false });
  }

  static async createAddress(userId: string, input: CreateDeliveryAddressInput) {
    const existingCount = await DeliveryAddress.countDocuments({ user: userId });
    const shouldBeDefault = input.isDefault ?? existingCount === 0;

    if (shouldBeDefault) {
      await this.clearDefaultForUser(userId);
    }

    const address = new DeliveryAddress({
      user: userId,
      ...input,
      country: input.country ?? 'Nigeria',
      isDefault: shouldBeDefault,
    });

    return address.save();
  }

  static async getUserAddresses(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [addresses, total] = await Promise.all([
      DeliveryAddress.find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DeliveryAddress.countDocuments({ user: userId }),
    ]);

    return { addresses, total, page, limit };
  }

  static async getAddressById(userId: string, addressId: string) {
    const address = await DeliveryAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new CustomError('Delivery address not found', 404, 'fail');
    }
    return address;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    updates: UpdateDeliveryAddressInput,
  ) {
    const address = await DeliveryAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new CustomError('Delivery address not found', 404, 'fail');
    }

    if (updates.isDefault === true) {
      await this.clearDefaultForUser(userId);
    }

    Object.assign(address, updates);
    return address.save();
  }

  static async setDefaultAddress(userId: string, addressId: string) {
    const address = await DeliveryAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new CustomError('Delivery address not found', 404, 'fail');
    }

    if (address.isDefault) {
      return address; // already default, nothing to do
    }

    await this.clearDefaultForUser(userId);
    address.isDefault = true;
    return address.save();
  }

  static async deleteAddress(userId: string, addressId: string) {
    const address = await DeliveryAddress.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new CustomError('Delivery address not found', 404, 'fail');
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    if (wasDefault) {
      const nextDefault = await DeliveryAddress.findOne({ user: userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return { success: true };
  }
}
