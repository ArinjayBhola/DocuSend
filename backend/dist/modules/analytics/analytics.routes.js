import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
const router = Router();
const controller = new AnalyticsController();
router.use(requireAuth);
router.use(loadUser);
// Note: The original route was /analytics/:id/analytics. 
// I'll keep it as GET /:id/analytics for now, to be mounted at /analytics
router.get('/:id/analytics', asyncHandler(controller.getDocumentAnalytics));
export default router;
