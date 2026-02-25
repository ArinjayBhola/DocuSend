import { Router } from 'express';
import { LiveController } from './live.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth } from '../auth/index.js';
const router = Router();
const controller = new LiveController();
// Public routes for viewer tracking
router.post('/sessions/start', asyncHandler(controller.startSession));
router.post('/sessions/page-change', asyncHandler(controller.pageChange));
// Beacons might use text/plain
router.post('/sessions/end', asyncHandler(controller.endSession));
// Protected routes
router.use(requireAuth);
router.get('/stream', controller.stream);
router.get('/engagement', asyncHandler(controller.getEngagement));
export default router;
