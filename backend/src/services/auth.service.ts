import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
  });

  return user;
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt };
}

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export async function loginOrLinkGoogleUser(profile: GoogleProfile) {
  if (!profile.emailVerified) {
    throw new AppError('Google account email is not verified', 401);
  }

  const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (existingByGoogleId) {
    return existingByGoogleId;
  }

  // Link to an existing email/password account so Google and normal login
  // resolve to the same User row instead of creating a duplicate account.
  const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.googleId,
        avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      authProvider: 'GOOGLE',
    },
  });
}

function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Returns the raw token to email to the user only if an account exists;
// callers must always respond with the same generic message either way so
// the API never reveals whether an email is registered.
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: hashResetToken(rawToken),
      resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashResetToken(rawToken);
  const user = await prisma.user.findFirst({ where: { resetTokenHash: tokenHash } });

  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    throw new AppError('This password reset link is invalid or has expired', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
}
