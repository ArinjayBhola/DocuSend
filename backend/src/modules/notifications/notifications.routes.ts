import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth } from '../auth/index.js';

const router = Router();
const controller = new NotificationsController();

router.use(requireAuth);

router.get('/', asyncHandler(controller.list));
router.get('/unread-count', asyncHandler(controller.unreadCount));
router.post('/read-all', asyncHandler(controller.markAllRead));
router.post('/:id/read', asyncHandler(controller.markRead));

router.get('/preferences', asyncHandler(controller.getPreferences));
router.put('/preferences', asyncHandler(controller.updatePreferences));

export default router;
