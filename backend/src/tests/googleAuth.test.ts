import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { registerUser, loginOrLinkGoogleUser } from '../services/auth.service';
import { uniqueEmail } from './helpers';

describe('Google OAuth account linking', () => {
  it('links a Google login to an existing email/password account (no duplicate)', async () => {
    const email = uniqueEmail('linked');
    const localUser = await registerUser({ name: 'Local User', email, password: 'password123' });

    const googleUser = await loginOrLinkGoogleUser({
      googleId: `google-${Date.now()}`,
      email,
      name: 'Local User',
      avatarUrl: 'https://example.com/avatar.png',
      emailVerified: true,
    });

    expect(googleUser.id).toBe(localUser.id);

    const count = await prisma.user.count({ where: { email } });
    expect(count).toBe(1);

    const stored = await prisma.user.findUnique({ where: { id: localUser.id } });
    expect(stored?.googleId).toBeTruthy();
    expect(stored?.passwordHash).toBeTruthy();
  });

  it('creates a new Google-only account when no email matches', async () => {
    const email = uniqueEmail('googleonly');
    const user = await loginOrLinkGoogleUser({
      googleId: `google-only-${Date.now()}`,
      email,
      name: 'Google Only',
      emailVerified: true,
    });

    expect(user.email).toBe(email);
    expect(user.authProvider).toBe('GOOGLE');
    expect(user.passwordHash).toBeNull();
  });

  it('reuses the same user on repeated Google logins (same googleId)', async () => {
    const email = uniqueEmail('repeat');
    const googleId = `google-repeat-${Date.now()}`;

    const first = await loginOrLinkGoogleUser({ googleId, email, name: 'Repeat', emailVerified: true });
    const second = await loginOrLinkGoogleUser({ googleId, email, name: 'Repeat', emailVerified: true });

    expect(second.id).toBe(first.id);
    const count = await prisma.user.count({ where: { googleId } });
    expect(count).toBe(1);
  });

  it('rejects unverified Google email', async () => {
    await expect(
      loginOrLinkGoogleUser({
        googleId: `google-unverified-${Date.now()}`,
        email: uniqueEmail('unverified'),
        name: 'Unverified',
        emailVerified: false,
      })
    ).rejects.toThrow();
  });

  it('redirects to login with an error when Google is not configured or state is missing', async () => {
    const res = await request(app).get('/api/auth/google/callback');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login');
    expect(res.headers.location).toContain('error=google_auth_failed');
  });
});
