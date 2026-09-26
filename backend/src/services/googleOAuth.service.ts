import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

function getClient(): OAuth2Client {
  if (!env.googleOAuthConfigured) {
    throw new AppError('Google login is not configured on this server', 503);
  }
  return new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleCallbackUrl);
}

export function buildGoogleAuthUrl(state: string): string {
  const client = getClient();
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });
}

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export async function exchangeCodeForProfile(code: string): Promise<GoogleUserInfo> {
  const client = getClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new AppError('Google did not return an identity token', 401);
  }

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new AppError('Could not verify Google account', 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture,
    emailVerified: Boolean(payload.email_verified),
  };
}
