import app from './app';
import { env, checkR2Config } from './config/env';
import { prisma } from './config/prisma';
import { ensureGoogleIdSparseIndex } from './config/ensureIndexes';
import { verifyR2Connectivity } from './services/storage.service';

async function main() {
  await prisma.$connect();

  try {
    await ensureGoogleIdSparseIndex();
  } catch (err) {
    console.error('[DB] Failed to verify/repair the User.googleId index:', err);
  }

  if (env.storageDriver === 'r2') {
    const configCheck = checkR2Config();
    if (!configCheck.ok) {
      console.error(`[R2] Startup check: missing required env vars: ${configCheck.missing.join(', ')}`);
    } else {
      for (const warning of configCheck.warnings) {
        console.warn(`[R2] Startup check warning: ${warning}`);
      }
      const result = await verifyR2Connectivity();
      if (result.ok) {
        console.log('[R2] Startup check: PutObject/DeleteObject verified successfully.');
      } else {
        console.error(`[R2] Startup check FAILED (${result.stage}): ${result.message}`);
      }
    }
  } else {
    console.log('[Storage] STORAGE_DRIVER=local — using local filesystem storage.');
  }

  const PORT = Number(process.env.PORT) || env.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
