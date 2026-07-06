import express from 'express';
import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { URLSearchParams } from 'url';
import { LogisticsController } from '../controllers/logisticsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '../models/userModel';
import { validate } from '../utils/validation';
import { LogisticsValidation } from '../utils/validations/logisticsValidation';

const router = express.Router();

interface LogisticsAuthResult {
  user: { _id: unknown };
  provider: { _id: unknown } | null;
  token: string;
  needsOnboarding: boolean;
}

const getAllowedDomains = (): string[] => {
  return [
    process.env.DEZENMART_DEPLOYED_URL,
    process.env.DEZENMART_LOGISTICS_FRONTEND_URL,
    'http://localhost:3000',
  ].filter((url): url is string => !!url);
};

function getRedirectUrl(state: string | undefined): string {
  const allowedDomains = getAllowedDomains();
  let redirectUrl = allowedDomains[0] || '/';

  if (!state) return redirectUrl;

  try {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    if (decodedState.origin && allowedDomains.includes(decodedState.origin)) {
      redirectUrl = decodedState.origin;
    }
  } catch (error) {
    console.error('Invalid state parameter in logistics OAuth callback:', error);
  }

  return redirectUrl;
}

// ── auth (public) ─────────────────────────────────────────────────────────────
router.get('/auth/google', (req: Request, res: Response, next: NextFunction) => {
  const { origin } = req.query;
  const allowedDomains = getAllowedDomains();

  if (typeof origin !== 'string' || !allowedDomains.includes(origin)) {
    const defaultErrorRedirect = allowedDomains[0] || '/';
    return res.redirect(`${defaultErrorRedirect}?error=invalid_origin`);
  }

  const state = Buffer.from(JSON.stringify({ origin })).toString('base64');

  passport.authenticate('google-logistics', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
});

router.get(
  '/auth/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    const state = req.query.state as string | undefined;
    const redirectUrl = getRedirectUrl(state);

    passport.authenticate(
      'google-logistics',
      { session: false },
      (err: any, authResult: LogisticsAuthResult | false, info: any) => {
        if (err || !authResult) {
          const message = err?.message || info?.message || 'Authentication failed';
          const errorParams = new URLSearchParams({
            error: 'auth_failed',
            message,
          }).toString();
          return res.redirect(`${redirectUrl}/auth/logistics/google?${errorParams}`);
        }

        const queryParams = new URLSearchParams({
          token: authResult.token,
          userId: String(authResult.user._id),
          accountType: 'logistics',
          needsOnboarding: String(authResult.needsOnboarding),
        });

        if (authResult.provider) {
          queryParams.append('providerId', String(authResult.provider._id));
        }

        return res.redirect(`${redirectUrl}/auth/logistics/google?${queryParams.toString()}`);
      },
    )(req, res, next);
  },
);

router.post(
  '/me/onboarding',
  authenticate,
  validate(LogisticsValidation.onboardMe),
  LogisticsController.onboardMe,
);

// ── location reference (public) ───────────────────────────────────────────────
router.get('/locations/states', LogisticsController.getStates);
router.get('/locations/states/:state/lgas', LogisticsController.getLgas);

// ── customer-facing provider search (authenticated, by delivery address) ──────
router.get(
  '/providers/by-address',
  authenticate,
  validate(LogisticsValidation.getProvidersByDeliveryAddress),
  LogisticsController.getProvidersByDeliveryAddress,
);

// ── customer-facing provider search (public) ──────────────────────────────────
router.get(
  '/available',
  validate(LogisticsValidation.getAvailableProviders),
  LogisticsController.getAvailableProviders,
);

// ── provider profile (logistics agent) ───────────────────────────────────────
router.get('/me', authenticate, authorizeRoles(Role.LOGISTICS_AGENT), LogisticsController.getMe);
router.put(
  '/me',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(LogisticsValidation.updateMe),
  LogisticsController.updateMe,
);

// ── pricing rules (logistics agent) ──────────────────────────────────────────
router.post(
  '/providers/me/pricing-rules',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(LogisticsValidation.createPricingRule),
  LogisticsController.createPricingRule,
);
router.get(
  '/providers/me/pricing-rules',
  LogisticsController.getPricingRules,
);
router.put(
  '/providers/me/pricing-rules/:ruleId',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  validate(LogisticsValidation.updatePricingRule),
  LogisticsController.updatePricingRule,
);
router.delete(
  '/providers/me/pricing-rules/:ruleId',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  LogisticsController.deletePricingRule,
);
router.patch(
  '/providers/me/pricing-rules/:ruleId/toggle',
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
  LogisticsController.togglePricingRule,
);

// ── provider listing (public) ─────────────────────────────────────────────────
router.get('/providers', LogisticsController.getAllProviders);
router.get('/providers/:id', LogisticsController.getProviderById);

// ── admin: verify provider ────────────────────────────────────────────────────
router.patch(
  '/providers/:id/verify',
  authenticate,
  authorizeRoles(Role.ADMIN),
  LogisticsController.verifyProvider,
);

// ── legacy CRUD (backward compat) ─────────────────────────────────────────────
router.post('/', authenticate, LogisticsController.createLogistics);
router.get('/', authenticate, LogisticsController.getAllLogistics);
router.get('/:id', authenticate, LogisticsController.getLogisticsById);
router.put('/:id', authenticate, LogisticsController.updateLogistics);
router.delete('/:id', authenticate, LogisticsController.deleteLogistics);

export default router;
