import { Router } from 'express';
import { SmartLinksController } from './smartlinks.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
import { checkSmartLinksAccess } from '../billing/index.js';

const router = Router();
const controller = new SmartLinksController();

router.use(requireAuth);
router.use(loadUser);
router.use(checkSmartLinksAccess);

router.post('/', asyncHandler(controller.create));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
router.post('/:id/duplicate', asyncHandler(controller.duplicate));

export default router;
