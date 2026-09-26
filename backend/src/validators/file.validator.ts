import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const sharingSchema = z.object({
  isPublic: z.boolean(),
});

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(120, 'Display name must be 120 characters or fewer')
    .nullable()
    .transform((v) => (v === '' ? null : v)),
});

export const pageParamSchema = z.object({
  pageNumber: z.coerce.number().int().min(1),
});
