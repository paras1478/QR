import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ok } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { listQuerySchema, searchQuerySchema, sharingSchema, displayNameSchema } from '../validators/file.validator';
import * as fileService from '../services/file.service';
import { generateQrDataUrl, buildShareUrl } from '../services/qr.service';

export async function upload(req: AuthRequest, res: Response) {
  if (!req.file) {
    throw new AppError('No file provided', 400);
  }

  const file = await fileService.uploadFile({
    userId: req.user!.id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    buffer: req.file.buffer,
  });

  const qr = await generateQrDataUrl(file.shareId);
  ok(res, { file, qrCode: qr, shareUrl: buildShareUrl(file.shareId) }, 201);
}

export async function list(req: AuthRequest, res: Response) {
  const { page, limit } = listQuerySchema.parse(req.query);
  const result = await fileService.listFiles(req.user!.id, page, limit);
  ok(res, result);
}

export async function search(req: AuthRequest, res: Response) {
  const { q, page, limit } = searchQuerySchema.parse(req.query);
  const result = await fileService.searchFiles(req.user!.id, q, page, limit);
  ok(res, result);
}

export async function getOne(req: AuthRequest, res: Response) {
  const file = await fileService.getOwnedFile(req.params.id, req.user!.id);
  const qr = await generateQrDataUrl(file.shareId);
  ok(res, { file, qrCode: qr, shareUrl: buildShareUrl(file.shareId) });
}

export async function remove(req: AuthRequest, res: Response) {
  await fileService.deleteFile(req.params.id, req.user!.id);
  ok(res, { message: 'File deleted' });
}

export async function regenerateShare(req: AuthRequest, res: Response) {
  const file = await fileService.regenerateShareId(req.params.id, req.user!.id);
  const qr = await generateQrDataUrl(file.shareId);
  ok(res, { file, qrCode: qr, shareUrl: buildShareUrl(file.shareId) });
}

export async function updateSharing(req: AuthRequest, res: Response) {
  const { isPublic } = sharingSchema.parse(req.body);
  const file = await fileService.setSharing(req.params.id, req.user!.id, isPublic);
  ok(res, { file });
}

export async function updateDisplayName(req: AuthRequest, res: Response) {
  const { displayName } = displayNameSchema.parse(req.body);
  const file = await fileService.setDisplayName(req.params.id, req.user!.id, displayName);
  ok(res, { file });
}
