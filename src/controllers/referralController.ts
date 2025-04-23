import { Request, Response } from 'express';
import { User } from '../models/userModel';
import { ReferralService } from '../services/referralService';

export class ReferralController {
  static applyReferralCode = async (req: Request, res: Response) => {
    const user = await ReferralService.applyReferralCode(
      req.user.id,
      req.body.referralCode,
    );
    res.json({
      success: true,
      referredBy: user.referredBy,
    });
  };

  static getReferralInfo = async (req: Request, res: Response) => {
    const user = await User.findById(req.user.id)
      .select('referralCode referralCount referredBy')
      .populate('referredBy', 'name email');

    res.json({
      referralCode: user?.referralCode,
      referralCount: user?.referralCount,
      referredBy: user?.referredBy,
    });
  };
}
