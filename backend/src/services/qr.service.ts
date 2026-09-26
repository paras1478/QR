import QRCode from 'qrcode';
import { env } from '../config/env';

export function buildShareUrl(shareId: string): string {
  return `${env.frontendUrl.replace(/\/$/, '')}/share/${shareId}`;
}

export async function generateQrDataUrl(shareId: string): Promise<string> {
  const url = buildShareUrl(shareId);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
  });
}
