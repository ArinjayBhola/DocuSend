import express, { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
const router = Router();
const controller = new BillingController();
router.get('/', requireAuth, loadUser, asyncHandler(controller.getBillingInfo));
router.post('/subscribe', requireAuth, loadUser, asyncHandler(controller.subscribe));
router.post('/cancel', requireAuth, loadUser, asyncHandler(controller.cancel));
router.post('/success', requireAuth, loadUser, asyncHandler(controller.success));
// Webhook needs raw body, we'll handle this in the main app setup or here with more specific middleware
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(controller.handleWebhook));
export default router;
