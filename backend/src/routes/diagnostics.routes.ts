import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { verifyR2Connectivity } from '../services/storage.service';
import { checkR2Config, env } from '../config/env';
import { ok } from '../utils/apiResponse';

const router = Router();

/**
 * Authenticated diagnostic endpoint: uploads and deletes a tiny throwaway
 * object to prove the configured R2 credentials/bucket/endpoint actually
 * allow writes, without touching any real user data. Never exposes secrets.
 */
router.get(
  '/r2',
  requireAuth,
  asyncHandler(async (req, res) => {
    const configCheck = checkR2Config();
    const result = await verifyR2Connectivity();

    ok(res, {
      storageDriver: env.storageDriver,
      configOk: configCheck.ok,
      missingEnvVars: configCheck.missing,
      configWarnings: configCheck.warnings,
      connectivity: result,
    });
  })
);

export default router;
