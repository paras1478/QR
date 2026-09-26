import { PDFDocument } from 'pdf-lib';
import { AppError } from '../utils/AppError';

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buffer);
  return doc.getPageCount();
}

export async function extractPdfPage(buffer: Buffer, pageNumber: number): Promise<Buffer> {
  const sourceDoc = await PDFDocument.load(buffer);
  const pageCount = sourceDoc.getPageCount();

  if (pageNumber < 1 || pageNumber > pageCount) {
    throw new AppError(`Invalid page number. This document has ${pageCount} page(s).`, 400);
  }

  const newDoc = await PDFDocument.create();
  const [copiedPage] = await newDoc.copyPages(sourceDoc, [pageNumber - 1]);
  newDoc.addPage(copiedPage);

  const bytes = await newDoc.save();
  return Buffer.from(bytes);
}
