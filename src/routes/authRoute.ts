import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser } from '../models/userModel';
import { URLSearchParams } from 'url';

interface AuthResult {
  user: IUser;
  token: string;
}

const router = express.Router();

router.get('/google', passport.authenticate('google'));

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const frontendUrl = process.env.FRONTEND_URL;
    passport.authenticate(
      'google',
      (err: any, authResult: AuthResult | false, info: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Authentication failed due to server error.',
          });
        }
        if (!authResult) {
          const message = info?.message || 'Authentication denied or failed';
          return res.status(401).json({ success: false, message });
        }
        req.logIn(authResult, { session: false }, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Failed to establish session.',
            });
          }
          const queryParams = new URLSearchParams({
            token: authResult.token,
            userId: (authResult.user as any)._id.toString(),
          }).toString();
          
          return res.redirect(`${frontendUrl}/auth/google?${queryParams}`);
        });
      },
    )(req, res, next);
  },
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

export default router;
