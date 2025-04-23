import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser } from '../models/userModel';

interface AuthResult {
  user: IUser;
  token: string;
}

const router = express.Router();

router.get('/google', passport.authenticate('google'));

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
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
          return res.json({
            success: true,
            message: 'Authentication successful.',
            user: authResult.user,
            token: authResult.token,
          });
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
