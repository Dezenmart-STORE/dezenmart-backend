import express from 'express';
import { LogisticsController } from '../controllers/logisticsController';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware';
import { Role } from '../models/userModel';
import { validate } from '../utils/validation';
import { LogisticsValidation } from '../utils/validations/logisticsValidation';

const router = express.Router();

// ── auth (public) ─────────────────────────────────────────────────────────────
router.post('/auth/register', validate(LogisticsValidation.register), LogisticsController.register);
router.post('/auth/login', validate(LogisticsValidation.login), LogisticsController.login);

// ── location reference (public) ───────────────────────────────────────────────
router.get('/locations/states', LogisticsController.getStates);
router.get('/locations/states/:state/lgas', LogisticsController.getLgas);

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
  authenticate,
  authorizeRoles(Role.LOGISTICS_AGENT),
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
