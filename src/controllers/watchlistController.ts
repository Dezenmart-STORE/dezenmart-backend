import { Request, Response } from 'express';
import { WatchlistService } from '../services/watchlistService';

export class WatchlistController {
  static addWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const watchlist = await WatchlistService.addWatchlist(
      req.user.id,
      req.params.productId,
    );
    res.status(201).json(watchlist);
  };

  static removeWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    await WatchlistService.removeWatchlist(req.user.id, req.params.productId);
    res.json({ success: true });
  };

  static getWatchlists = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const watchlists = await WatchlistService.getUserWatchlists(
      req.user.id,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(watchlists);
  };

  static checkWatchlist = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const result = await WatchlistService.checkWatchlist(
      req.user.id,
      req.params.productId,
    );
    res.json(result);
  };
}
