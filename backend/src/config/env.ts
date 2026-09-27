import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const databaseUrl = required('DATABASE_URL');
if (!/^mongodb(\+srv)?:\/\//.test(databaseUrl)) {
  throw new Error(
    'DATABASE_URL must be a MongoDB connection string starting with "mongodb://" or "mongodb+srv://"'
  );
}

export const env = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  databaseUrl,

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: process.env.COOKIE_NAME || 'qrfs_token',

  // FRONTEND_URL may be a comma-separated list (local + production origins) to
  // support CORS across environments. The first entry is used as the single
  // canonical origin for redirects and QR/share links.
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, ''),
  allowedOrigins: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/auth/google/callback',
  get googleOAuthConfigured(): boolean {
    return Boolean(this.googleClientId && this.googleClientSecret);
  },

  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 'r2',
  localStoragePath: path.resolve(__dirname, '../../', process.env.LOCAL_STORAGE_PATH || '../storage/uploads'),

  r2AccountId: process.env.R2_ACCOUNT_ID || '',
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  r2BucketName: process.env.R2_BUCKET_NAME || '',
  r2Endpoint: process.env.R2_ENDPOINT || '',
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',

  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
};

const REQUIRED_R2_VARS = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_ENDPOINT'] as const;

export function checkR2Config(): { ok: boolean; missing: string[]; warnings: string[] } {
  const missing = REQUIRED_R2_VARS.filter((name) => !process.env[name]);
  const warnings: string[] = [];

  if (env.r2Endpoint && env.r2AccountId) {
    const expectedEndpoint = `https://${env.r2AccountId}.r2.cloudflarestorage.com`;
    if (env.r2Endpoint.replace(/\/$/, '') !== expectedEndpoint) {
      warnings.push(
        `R2_ENDPOINT does not match the expected format "${expectedEndpoint}" (got "${env.r2Endpoint}"). ` +
          'It must be the bare account endpoint with no bucket path appended.'
      );
    }
  }

  return { ok: missing.length === 0, missing, warnings };
}
