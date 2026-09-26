import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { upload as uploadMiddleware } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';
import * as fileController from '../controllers/file.controller';

const router = Router();

router.use(requireAuth);

router.post('/upload', uploadLimiter, uploadMiddleware.single('file'), asyncHandler(fileController.upload));
router.get('/search', asyncHandler(fileController.search));
router.get('/', asyncHandler(fileController.list));
router.get('/:id', asyncHandler(fileController.getOne));
router.delete('/:id', asyncHandler(fileController.remove));
router.post('/:id/regenerate-share', asyncHandler(fileController.regenerateShare));
router.patch('/:id/sharing', asyncHandler(fileController.updateSharing));
router.patch('/:id/display-name', asyncHandler(fileController.updateDisplayName));

export default router;
