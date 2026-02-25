import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
import { checkWorkspaceLimit } from '../billing/index.js';
const router = Router();
const controller = new WorkspacesController();
// Public route
router.get('/public/:slug', asyncHandler(controller.getPublic));
// Protected routes
router.use(requireAuth);
router.use(loadUser);
router.get('/', asyncHandler(controller.list));
router.post('/', checkWorkspaceLimit, asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.getOne));
router.delete('/:id', asyncHandler(controller.delete));
router.post('/:id/documents', asyncHandler(controller.addDocument));
router.delete('/:id/documents/:wdId', asyncHandler(controller.removeDocument));
export default router;
