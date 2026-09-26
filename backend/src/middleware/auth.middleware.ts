import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { fail } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: { id: string; name: string; email: string; avatarUrl: string | null };
  file?: Express.Multer.File;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) {
      return fail(res, 'Authentication required', 401);
    }

    const payload = verifyToken(token);

    // Every protected request must verify the user still exists in the database.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    if (!user) {
      return fail(res, 'Authentication required', 401);
    }

    req.user = user;
    next();
  } catch {
    return fail(res, 'Authentication required', 401);
  }
}
