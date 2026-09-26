import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function makeTestPdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([300, 300]);
    page.drawText(`Page ${i}`, { x: 100, y: 150, size: 24, font });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
