import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { fail } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: { id: string; name: string; email: string; avatarUrl: string | null };
  file?: Express.Multer.File;
}

function extractToken(req: Request): string | undefined {
  // Prefer the Authorization header: the auth cookie is cross-site in
  // production (frontend-*.onrender.com and backend-*.onrender.com are
  // different registrable domains), so some browsers' third-party cookie
  // restrictions can silently drop it even with SameSite=None; Partitioned.
  // A Bearer token sent explicitly by the frontend is unaffected by that.
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  return req.cookies?.[env.cookieName];
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
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
