import { Request, Response } from 'express';
import { RewardService } from '../services/rewardService';

export class RewardController {
  static getUserRewards = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const rewards = await RewardService.getUserRewards(
      req.user.id,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10,
    );
    res.json(rewards);
  };

  static getPointsSummary = async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const summary = await RewardService.getUserPointsSummary(req.user.id);
    res.json(summary);
  };
}
