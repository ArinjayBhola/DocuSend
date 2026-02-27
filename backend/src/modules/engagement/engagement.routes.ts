import { Router } from 'express';
import { EngagementController } from './engagement.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
import { checkEngagementAccess } from '../billing/index.js';

const router = Router();
const controller = new EngagementController();

router.use(requireAuth);
router.use(loadUser);
router.use(asyncHandler(checkEngagementAccess));

router.get('/scores', asyncHandler(controller.getScores));
router.get('/scores/:documentId', asyncHandler(controller.getDocumentScores));
router.get('/follow-ups', asyncHandler(controller.getFollowUps));
router.get('/documents/performance', asyncHandler(controller.getDocumentPerformance));

export default router;
