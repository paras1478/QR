import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, asyncHandler(authController.register));
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', requireAuth, asyncHandler(authController.me));

router.get('/google', authLimiter, asyncHandler(authController.googleLogin));
router.get('/google/callback', asyncHandler(authController.googleCallback));

export default router;
