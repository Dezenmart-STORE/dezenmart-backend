import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { ReferralService } from '../services/referralService';

export class ReferralController {
  static applyReferralCode = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const user = await ReferralService.applyReferralCode(
      (req.user as any).id,
      req.body.referralCode,
    );
    res.json({
      success: true,
      referredBy: user.referredBy,
    });
  };

  static getReferralInfo = async (req: Request, res: Response) => {
    if (!req.user || !(req.user as any).id) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const user = await User.findById((req.user as any).id)
      .select('referralCode referralCount referredBy')
      .populate('referredBy', 'name email');

    res.json({
      referralCode: user?.referralCode,
      referralCount: user?.referralCount,
      referredBy: user?.referredBy,
    });
  };
}
