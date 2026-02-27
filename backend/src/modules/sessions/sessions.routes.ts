import { Router } from 'express';
import { SessionsController } from './sessions.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
import { checkSessionLimit } from '../billing/index.js';

const router = Router();
const controller = new SessionsController();

router.use(requireAuth);
router.use(loadUser);

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(checkSessionLimit), asyncHandler(controller.create));
router.post('/join', asyncHandler(controller.join));

router.get('/:id', asyncHandler(controller.getOne));
router.post('/:id/start', asyncHandler(controller.start));
router.post('/:id/end', asyncHandler(controller.end));
router.post('/:id/leave', asyncHandler(controller.leave));
router.get('/:id/stream', controller.stream); // SSE shouldn't use asyncHandler if it manages res directly
router.post('/:id/presence', asyncHandler(controller.updatePresence));
router.post('/:id/hand-raise', asyncHandler(controller.raiseHand));
router.post('/:id/screen-share', asyncHandler(controller.screenShare));
router.post('/:id/typing', asyncHandler(controller.typing));
router.post('/:id/signal', asyncHandler(controller.signal));

router.get('/:id/annotations', asyncHandler(controller.getAnnotations));
router.post('/:id/annotations', asyncHandler(controller.addAnnotation));
router.put('/:id/annotations/:aid', asyncHandler(controller.updateAnnotation));
router.delete('/:id/annotations/:aid', asyncHandler(controller.deleteAnnotation));

router.get('/:id/messages', asyncHandler(controller.getMessages));
router.post('/:id/messages', asyncHandler(controller.addMessage));

export default router;
