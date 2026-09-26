import path from 'path';

export function sanitizeFilename(originalName: string): string {
  const base = path.basename(originalName);
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 180);
  return cleaned || 'file';
}
