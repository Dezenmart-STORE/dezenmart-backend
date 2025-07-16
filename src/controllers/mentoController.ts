import { Request, Response } from 'express';
import { mentoService } from '../services/mentoService';

// Celo Mainnet & Alfajores Testnet Token Addresses
const TOKENS = {
  CELO: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9', // Alfajores CELO
  CUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1', // Alfajores cUSD
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
