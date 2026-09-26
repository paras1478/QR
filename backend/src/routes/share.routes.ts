import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as shareController from '../controllers/share.controller';

const router = Router();

router.get('/:shareId', asyncHandler(shareController.getPublic));
router.get('/:shareId/download', asyncHandler(shareController.downloadFull));
router.get('/:shareId/page/:pageNumber', asyncHandler(shareController.downloadPage));

export default router;
