import { Request, Response } from 'express';
import { mentoService } from '../services/mentoService';

// Celo Mainnet & Celo Sepolia testnet token addresses
const TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438', // Celo Sepolia native CELO
  CUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b', // USDm
  cREAL: '0x2294298942fdc79417DE9E0D740A4957E0e7783a', // BRLm
  cGBP: '0x85F5181Abdbf0e1814Fc4358582Ae07b8eBA3aF3', // GBPm
  cEUR: '0xA99dC247d6b7B2E3ab48a1fEE101b83cD6aCd82a', // EURm
  // Add other Mento tokens as needed
};

export class MentoController {
  static async getQuote(req: Request, res: Response): Promise<void> {
    try {
      const { tokenIn, tokenOut, amountIn } = req.body;

      if (!tokenIn || !tokenOut || !amountIn) {
        res.status(400).json({
          message: 'Missing required fields: tokenIn, tokenOut, amountIn',
        });
        return;
      }

      const tokenInAddr =
        TOKENS[tokenIn.trim().toUpperCase() as keyof typeof TOKENS];
      const tokenOutAddr =
        TOKENS[tokenOut.trim().toUpperCase() as keyof typeof TOKENS];

      if (!tokenInAddr || !tokenOutAddr) {
        res.status(400).json({ message: 'Invalid token symbol provided.' });
        return;
      }

      const { quote } = await mentoService.getSwapQuote(
        tokenInAddr as `0x${string}`,
        tokenOutAddr as `0x${string}`,
        amountIn,
      );

      res.status(200).json({
        fromToken: tokenIn,
        toToken: tokenOut,
        amountIn,
        estimatedAmountOut: quote,
      });
    } catch (error: any) {
      console.error('Error getting Mento quote:', error);
      res
        .status(500)
        .json({ message: 'Failed to get quote', error: error.message });
    }
  }

  static async swapTokens(req: Request, res: Response): Promise<void> {
    try {
      const { tokenIn, tokenOut, amountIn, slippage } = req.body;
      if (!tokenIn || !tokenOut || !amountIn) {
        res.status(400).json({
          message: 'Missing required fields: tokenIn, tokenOut, amountIn',
        });
        return;
      }

      const tokenInAddr =
        TOKENS[tokenIn.trim().toUpperCase() as keyof typeof TOKENS];
      const tokenOutAddr =
        TOKENS[tokenOut.trim().toUpperCase() as keyof typeof TOKENS];

      if (!tokenInAddr || !tokenOutAddr) {
        res.status(400).json({ message: 'Invalid token symbol provided.' });
        return;
      }

      const result = await mentoService.swap(
        tokenInAddr as `0x${string}`,
        tokenOutAddr as `0x${string}`,
        amountIn,
        slippage,
      );

      res.status(200).json({ message: 'Swap successful', ...result });
    } catch (error: any) {
      console.error('Error performing Mento swap:', error);
      res.status(500).json({ message: 'Swap failed', error: error.message });
    }
  }
}
