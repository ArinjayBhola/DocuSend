import { Router, express } from 'express';
import { ShareController } from './share.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';

const router = Router();
const controller = new ShareController();

router.get('/:slug', asyncHandler(controller.getMetadata));
router.post('/:slug/verify-password', asyncHandler(controller.verifyPassword));
router.post('/:slug/submit-email', asyncHandler(controller.submitEmail));

router.post('/views/start', asyncHandler(controller.startView));
router.post('/views/page', asyncHandler(controller.trackPage));
router.post('/views/end', asyncHandler(controller.endView));

router.get('/pdf/:slug', asyncHandler(controller.serveFile));

export default router;
