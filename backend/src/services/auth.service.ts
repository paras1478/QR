import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

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
