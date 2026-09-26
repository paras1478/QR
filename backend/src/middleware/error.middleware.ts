import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { fail } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response) {
  fail(res, 'Route not found', 404);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => e.message).join(', ');
    return fail(res, message, 400);
  }

  if (err instanceof AppError) {
    return fail(res, err.message, err.status);
  }

  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      return fail(res, 'File is too large', 413);
    }
  }

  console.error(err);
  return fail(res, 'Internal server error', 500);
}
