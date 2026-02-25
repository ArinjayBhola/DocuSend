import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';

const router = Router();
const controller = new DashboardController();

router.use(requireAuth);
router.use(loadUser);

router.get('/', asyncHandler(controller.getSummary));

export default router;
