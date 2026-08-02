import { User } from '../models/userModel';
import { CustomError } from '../middlewares/errorHandler';

interface WalletStatus {
  hasWallet: boolean;
  walletAddress: string | null;
  chainId?: number;
  provider?: string;
}

interface SetupWalletInput {
  walletAddress: string;
  chainId: number;
  provider: string;
  dynamicUserId?: string;
}

function toWalletStatus(user: {
  walletAddress?: string;
  chainId?: number;
  walletProvider?: string;
}): WalletStatus {
  if (!user.walletAddress) {
    return { hasWallet: false, walletAddress: null };
  }
  return {
    hasWallet: true,
    walletAddress: user.walletAddress,
    chainId: user.chainId,
    provider: user.walletProvider,
  };
}

export class WalletService {
  static async getWalletStatus(userId: string): Promise<WalletStatus> {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'fail');
    }
    return toWalletStatus(user);
  }

  static async setupWallet(userId: string, input: SetupWalletInput): Promise<WalletStatus> {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          walletAddress: input.walletAddress,
          chainId: input.chainId,
          walletProvider: input.provider,
          ...(input.dynamicUserId && { dynamicUserId: input.dynamicUserId }),
        },
      },
      { new: true },
    );
    if (!updatedUser) {
      throw new CustomError('User not found', 404, 'fail');
    }
    return toWalletStatus(updatedUser);
  }
}
