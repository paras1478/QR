import path from 'path';
import { prisma } from '../config/prisma';
import { storage } from './storage.service';
import { generateShareId, generateStorageId } from '../utils/ids';
import { sanitizeFilename } from '../utils/sanitize';
import { AppError } from '../utils/AppError';

interface UploadInput {
  userId: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export async function uploadFile(input: UploadInput) {
  const safeName = sanitizeFilename(input.originalName);
  const storageId = generateStorageId();
  const storageKey = `users/${input.userId}/${storageId}/${safeName}`;
  const shareId = generateShareId();

  // Storage write happens first and must succeed before we ever create a
  // MongoDB record — this guarantees File metadata is never saved for a
  // file that doesn't actually exist in R2/local storage.
  try {
    await storage.putObject(storageKey, input.buffer, input.mimeType);
  } catch (err) {
    const info = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (info?.name === 'AccessDenied' || info?.$metadata?.httpStatusCode === 403) {
      throw new AppError(
        'File storage rejected the upload (access denied). This is a storage configuration issue on the server, not something you can fix — please contact the administrator.',
        502
      );
    }
    throw new AppError('Failed to store the uploaded file. Please try again.', 502);
  }

  const file = await prisma.file.create({
    data: {
      userId: input.userId,
      originalName: safeName,
      storageKey,
      mimeType: input.mimeType,
      size: input.size,
      shareId,
      isPublic: true,
    },
  });

  return file;
}

export async function listFiles(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.file.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function searchFiles(userId: string, query: string, page: number, limit: number) {
  const where = {
    userId,
    ...(query
      ? {
          originalName: {
            contains: query,
            mode: 'insensitive' as const,
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.file.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export async function getOwnedFile(fileId: string, userId: string) {
  if (!OBJECT_ID_RE.test(fileId)) {
    throw new AppError('File not found', 404);
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    throw new AppError('File not found', 404);
  }
  if (file.userId !== userId) {
    throw new AppError('You do not have access to this file', 403);
  }
  return file;
}

export async function deleteFile(fileId: string, userId: string) {
  const file = await getOwnedFile(fileId, userId);
  await storage.deleteObject(file.storageKey);
  await prisma.file.delete({ where: { id: file.id } });
}

export async function regenerateShareId(fileId: string, userId: string) {
  await getOwnedFile(fileId, userId);
  const newShareId = generateShareId();
  return prisma.file.update({ where: { id: fileId }, data: { shareId: newShareId } });
}

export async function setSharing(fileId: string, userId: string, isPublic: boolean) {
  await getOwnedFile(fileId, userId);
  return prisma.file.update({ where: { id: fileId }, data: { isPublic } });
}

export async function setDisplayName(fileId: string, userId: string, displayName: string | null) {
  await getOwnedFile(fileId, userId);
  return prisma.file.update({ where: { id: fileId }, data: { displayName } });
}

export function extForMime(mimeType: string, originalName: string) {
  return path.extname(originalName).toLowerCase() || '';
}
