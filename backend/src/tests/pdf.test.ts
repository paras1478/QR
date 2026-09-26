import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { getPdfPageCount, extractPdfPage } from '../services/pdf.service';
import { makeTestPdf } from './helpers';

describe('PDF service', () => {
  it('counts pages correctly', async () => {
    const pdf = await makeTestPdf(10);
    const count = await getPdfPageCount(pdf);
    expect(count).toBe(10);
  });

  it('extracts exactly one page', async () => {
    const pdf = await makeTestPdf(10);
    const pageBuf = await extractPdfPage(pdf, 7);
    const doc = await PDFDocument.load(pageBuf);
    expect(doc.getPageCount()).toBe(1);
  });

  it('extracts the last page without error', async () => {
    const pdf = await makeTestPdf(10);
    const pageBuf = await extractPdfPage(pdf, 10);
    const doc = await PDFDocument.load(pageBuf);
    expect(doc.getPageCount()).toBe(1);
  });

  it('throws for page number 0', async () => {
    const pdf = await makeTestPdf(5);
    await expect(extractPdfPage(pdf, 0)).rejects.toThrow();
  });

  it('throws for page number beyond page count', async () => {
    const pdf = await makeTestPdf(5);
    await expect(extractPdfPage(pdf, 6)).rejects.toThrow();
  });
});
