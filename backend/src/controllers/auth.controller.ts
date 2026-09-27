import { Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { forgotPasswordSchema, resetPasswordSchema, registerSchema, loginSchema } from '../validators/auth.validator';
import {
  registerUser,
  loginUser,
  loginOrLinkGoogleUser,
  createPasswordResetToken,
  resetPasswordWithToken,
} from '../services/auth.service';
import { sendPasswordResetEmail } from '../services/email.service';
import { buildGoogleAuthUrl, exchangeCodeForProfile } from '../services/googleOAuth.service';
import { signToken } from '../utils/jwt';
import { ok, fail } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth.middleware';

// Frontend and backend are deployed on different origins/subdomains in
// production (e.g. Render), so the auth cookie must be sent cross-site.
// "SameSite=None" is required for that — and browsers mandate "Secure"
// whenever SameSite=None is used, which is satisfied since production
// is always served over HTTPS. In local dev both apps share the same
// site (loopback), so "Lax" is used there since it doesn't require HTTPS.
//
// frontend-*.onrender.com and backend-*.onrender.com are different
// registrable domains (onrender.com is on the Public Suffix List), so this
// cookie is a genuine third-party cookie in production. Some browsers
// (Chrome's third-party cookie deprecation, CHIPS) partition or drop
// SameSite=None cookies unless "Partitioned" is set, so it's added in
// production to keep the cookie working under those policies.
const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: (env.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
  partitioned: env.isProduction,
};

const OAUTH_STATE_COOKIE = 'qrfs_oauth_state';

export async function register(req: AuthRequest, res: Response) {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  const token = signToken({ userId: user.id });
  res.cookie(env.cookieName, token, cookieOptions);
  ok(res, { user, token }, 201);
}

export async function login(req: AuthRequest, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await loginUser(input);
  const token = signToken({ userId: user.id });
  res.cookie(env.cookieName, token, cookieOptions);
  ok(res, { user, token });
}

export async function logout(req: AuthRequest, res: Response) {
  res.clearCookie(env.cookieName, { ...cookieOptions, maxAge: undefined });
  ok(res, { message: 'Logged out' });
}

export async function me(req: AuthRequest, res: Response) {
  ok(res, { user: req.user });
}

export async function forgotPassword(req: AuthRequest, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  const genericMessage = 'If an account exists for this email, a password reset link has been sent.';

  const rawToken = await createPasswordResetToken(input.email);
  if (rawToken) {
    const resetUrl = `${env.frontendUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(input.email, resetUrl);
    } catch (err) {
      console.error('Failed to send password reset email', err);
    }
  }

  ok(res, { message: genericMessage });
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await resetPasswordWithToken(input.token, input.password);
  ok(res, { message: 'Password reset successfully' });
}

export async function googleLogin(req: AuthRequest, res: Response) {
  if (!env.googleOAuthConfigured) {
    return fail(res, 'Google login is not configured on this server', 503);
  }

  const state = crypto.randomBytes(24).toString('hex');
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/google',
  });
  const url = buildGoogleAuthUrl(state);
  res.redirect(url);
}

export async function googleCallback(req: AuthRequest, res: Response) {
  const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
  res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/auth/google' });

  const failureRedirect = `${env.frontendUrl.replace(/\/$/, '')}/login?error=google_auth_failed`;

  if (error || !code || !state || !expectedState || state !== expectedState) {
    return res.redirect(failureRedirect);
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    const user = await loginOrLinkGoogleUser({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
    });

    const token = signToken({ userId: user.id });
    res.cookie(env.cookieName, token, cookieOptions);
    // The token is also passed via URL fragment (never sent to the server,
    // never logged) so the frontend can store it for use as a Bearer token.
    // This is required because the auth cookie alone is unreliable here:
    // frontend-*.onrender.com and backend-*.onrender.com are different
    // registrable domains, so the cookie is third-party and some browsers'
    // cross-site cookie restrictions can silently drop it.
    res.redirect(`${env.frontendUrl.replace(/\/$/, '')}/dashboard#token=${token}`);
  } catch {
    res.redirect(failureRedirect);
  }
}
