import { Request, Response } from 'express';
import { WatchlistService } from '../services/watchlistService';

export class WatchlistController {
  static addWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const watchlist = await WatchlistService.addWatchlist(
      (req.user as any).id,
      productId,
    );
    res.status(201).json(watchlist);
  };

  static removeWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    await WatchlistService.removeWatchlist((req.user as any).id, productId);
    res.json({ success: true });
  };

  static getWatchlists = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const watchlists = await WatchlistService.getUserWatchlists(
      (req.user as any).id,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(watchlists);
  };

  static checkWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const result = await WatchlistService.checkWatchlist(
      (req.user as any).id,
      productId,
    );
    res.json(result);
  };
}
