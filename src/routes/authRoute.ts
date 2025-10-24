import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser } from '../models/userModel';
import { URLSearchParams } from 'url';

interface AuthResult {
  user: IUser;
  token: string;
}

const router = express.Router();

// Helper function to get allowed domains
const getAllowedDomains = (): string[] => {
  const domains = [
    'http://localhost:5173',
    process.env.DEZENMART_FRONTEND_URL,
    process.env.DEZENTRA_FRONTEND_URL,
  ].filter((url): url is string => !!url);

  return domains;
};

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  const { origin } = req.query;
  const allowedDomains = getAllowedDomains();

  // Validate the origin to prevent open redirect vulnerabilities.
  if (typeof origin !== 'string' || !allowedDomains.includes(origin)) {
    // Redirect to a default error page or the primary frontend with an error
    const defaultErrorRedirect = allowedDomains[0] || '/';
    return res.redirect(`${defaultErrorRedirect}?error=invalid_origin`);
  }

  // Securely pass the origin using the 'state' parameter.
  const state = Buffer.from(JSON.stringify({ origin })).toString('base64');

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state, // Pass the encoded state to Google
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const state = req.query.state as string;
    const allowedDomains = getAllowedDomains();
    let redirectUrl = allowedDomains[0] || '/'; // Default redirect URL

    passport.authenticate(
      'google',
      { session: false }, // Use token-based auth, no server session needed.
      (err: any, authResult: AuthResult | false, info: any) => {
        // Decode the state to find out where to redirect.
        if (state) {
          try {
            const decodedState = JSON.parse(
              Buffer.from(state, 'base64').toString('utf8'),
            );
            if (
              decodedState.origin &&
              allowedDomains.includes(decodedState.origin)
            ) {
              redirectUrl = decodedState.origin;
            }
          } catch (e) {
            console.error('Invalid state parameter in OAuth callback:', e);
          }
        }

        // If authentication fails, redirect back to the correct frontend with an error.
        if (err || !authResult) {
          const message = info?.message || 'Authentication failed';
          const errorParams = new URLSearchParams({
            error: 'auth_failed',
            message,
          }).toString();
          return res.redirect(`${redirectUrl}/auth/google?${errorParams}`);
        }

        // On success, redirect back to the correct frontend with the token.
        const queryParams = new URLSearchParams({
          token: authResult.token,
          userId: (authResult.user as any)._id.toString(),
        }).toString();

        return res.redirect(`${redirectUrl}/auth/google?${queryParams}`);
      },
    )(req, res, next);
  },
);

router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  const origin = req.query.origin as string;
  const allowedDomains = getAllowedDomains();

  // Default to the first configured domain or a root path.
  let redirectUrl = allowedDomains[0] || '/';

  // Only redirect to the origin if it's in the allowlist.
  if (origin && allowedDomains.includes(origin)) {
    redirectUrl = origin;
  }

  req.logout((err) => {
    if (err) {
      // Pass the error to a proper error-handling middleware.
      return next(err);
    }
    res.redirect(redirectUrl);
  });
});

export default router;
