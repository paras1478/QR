import { Response, Request } from 'express';
import { ok } from '../utils/apiResponse';
import { pageParamSchema } from '../validators/file.validator';
import * as shareService from '../services/share.service';

function contentDisposition(filename: string, disposition: 'attachment' | 'inline' = 'attachment'): string {
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encoded}`;
}

export async function getPublic(req: Request, res: Response) {
  const data = await shareService.getPublicFileWithPageCount(req.params.shareId);
  ok(res, data);
}

export async function downloadFull(req: Request, res: Response) {
  const { buffer, file } = await shareService.downloadPublicFile(req.params.shareId);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', contentDisposition(file.originalName));
  res.send(buffer);
}

export async function previewPdf(req: Request, res: Response) {
  const { buffer, file } = await shareService.previewPublicPdf(req.params.shareId);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition(file.originalName, 'inline'));
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.send(buffer);
}

export async function downloadPage(req: Request, res: Response) {
  const { pageNumber } = pageParamSchema.parse(req.params);
  const { buffer, file } = await shareService.downloadPublicFilePage(req.params.shareId, pageNumber);
  const base = file.originalName.replace(/\.pdf$/i, '');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', contentDisposition(`${base}-page-${pageNumber}.pdf`));
  res.send(buffer);
}
