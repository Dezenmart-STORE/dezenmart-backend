import { Address } from 'viem';
import { CustomError } from '../middlewares/errorHandler';
import { Logistics, ILogistics } from '../models/logisticsModel';
import { contractService } from '../server';

interface ICreateLogisticsInput {
  name: string;
  walletAddress: string;
}

export class LogisticsService {
  static async createLogistics(
    logisticsInput: ICreateLogisticsInput,
  ): Promise<ILogistics> {
    const { name, walletAddress } = logisticsInput;

    if (!walletAddress) {
      throw new CustomError(
        'Wallet address is required for logistics provider.',
        400,
        'fail',
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new CustomError(
        'Logistics provider name is required.',
        400,
        'fail',
      );
    }
    if (
      !walletAddress ||
      typeof walletAddress !== 'string' ||
      !walletAddress.startsWith('0x')
    ) {
      throw new CustomError(
        'A valid wallet address (starting with "0x") is required.',
        400,
        'fail',
      );
    }

    const existingLogistics = await Logistics.findOne({
      $or: [{ name }, { walletAddress }],
    });
    if (existingLogistics) {
      throw new CustomError(
        'A logistics provider with this name or wallet address already exists.',
        409,
        'fail',
      );
    }

    await contractService.registerLogisticsProvider(walletAddress as Address);

    const newLogisticsProvider = new Logistics({
      name,
      walletAddress,
    });

    return await newLogisticsProvider.save();
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
}
