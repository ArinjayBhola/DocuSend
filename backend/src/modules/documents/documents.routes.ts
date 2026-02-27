import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocumentsController } from './documents.controller.js';
import { asyncHandler } from '../../core/utils/asyncHandler.js';
import { requireAuth, loadUser } from '../auth/index.js';
import { checkDocumentLimit } from '../billing/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const controller = new DocumentsController();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIMETYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files (PNG, JPG, GIF, WebP) are allowed'));
    }
  },
});

router.use(requireAuth);
router.use(loadUser);

router.post('/upload', asyncHandler(checkDocumentLimit), upload.single('document'), asyncHandler(controller.upload));
router.get('/:id', asyncHandler(controller.getOne));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

export default router;
