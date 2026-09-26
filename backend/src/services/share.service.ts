import { prisma } from '../config/prisma';
import { storage } from './storage.service';
import { AppError } from '../utils/AppError';
import { getPdfPageCount, extractPdfPage } from './pdf.service';

export async function getPublicFile(shareId: string) {
  const file = await prisma.file.findUnique({ where: { shareId } });
  if (!file || !file.isPublic) {
    throw new AppError('This file is not available', 404);
  }
  return file;
}

export async function getPublicFileWithPageCount(shareId: string) {
  const file = await getPublicFile(shareId);
  let pageCount: number | null = null;

  if (file.mimeType === 'application/pdf') {
    const buffer = await storage.getObject(file.storageKey);
    pageCount = await getPdfPageCount(buffer);
  }

  return {
    id: file.id,
    shareId: file.shareId,
    originalName: file.originalName,
    displayName: file.displayName,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
    pageCount,
  };
}

export async function downloadPublicFile(shareId: string) {
  const file = await getPublicFile(shareId);
  const buffer = await storage.getObject(file.storageKey);
  return { buffer, file };
}

export async function downloadPublicFilePage(shareId: string, pageNumber: number) {
  const file = await getPublicFile(shareId);
  if (file.mimeType !== 'application/pdf') {
    throw new AppError('This file is not a PDF', 400);
  }
  const original = await storage.getObject(file.storageKey);
  const pageBuffer = await extractPdfPage(original, pageNumber);
  return { buffer: pageBuffer, file };
}
