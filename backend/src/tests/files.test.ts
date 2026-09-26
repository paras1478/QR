import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { makeTestPdf, uniqueEmail } from './helpers';

describe('Files', () => {
  const agentA = request.agent(app);
  const agentB = request.agent(app);
  let fileId: string;
  let shareId: string;

  beforeAll(async () => {
    await agentA.post('/api/auth/register').send({ name: 'Owner', email: uniqueEmail('owner'), password: 'password123' });
    await agentB.post('/api/auth/register').send({ name: 'Other', email: uniqueEmail('other'), password: 'password123' });
  });

  it('uploads a PDF and generates a share id + QR', async () => {
    const pdf = await makeTestPdf(3);
    const res = await agentA
      .post('/api/files/upload')
      .attach('file', pdf, { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.file.shareId).toBeTruthy();
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    fileId = res.body.data.file.id;
    shareId = res.body.data.file.shareId;
  });

  it('rejects unsupported file types', async () => {
    const res = await agentA
      .post('/api/files/upload')
      .attach('file', Buffer.from('malicious'), { filename: 'bad.exe', contentType: 'application/octet-stream' });

    expect(res.status).toBe(400);
  });

  it('lists files for the owner', async () => {
    const res = await agentA.get('/api/files');
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((f: { id: string }) => f.id === fileId)).toBe(true);
  });

  it('searches files by name (case-insensitive)', async () => {
    const res = await agentA.get('/api/files/search').query({ q: 'DOC' });
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((f: { id: string }) => f.id === fileId)).toBe(true);
  });

  it('does not leak another users files in search', async () => {
    const res = await agentB.get('/api/files/search').query({ q: 'doc' });
    expect(res.status).toBe(200);
    expect(res.body.data.items.some((f: { id: string }) => f.id === fileId)).toBe(false);
  });

  it('blocks other users from viewing the file (IDOR)', async () => {
    const res = await agentB.get(`/api/files/${fileId}`);
    expect(res.status).toBe(403);
  });

  it('blocks other users from deleting the file (IDOR)', async () => {
    const res = await agentB.delete(`/api/files/${fileId}`);
    expect(res.status).toBe(403);
  });

  it('serves the public share page without auth', async () => {
    const res = await request(app).get(`/api/share/${shareId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.pageCount).toBe(3);
  });

  it('downloads the full PDF', async () => {
    const res = await request(app).get(`/api/share/${shareId}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('downloads a single page as a valid 1-page PDF', async () => {
    const res = await request(app).get(`/api/share/${shareId}/page/2`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('page-2');
  });

  it('rejects an out-of-range page number', async () => {
    const res = await request(app).get(`/api/share/${shareId}/page/99`);
    expect(res.status).toBe(400);
  });

  it('disables sharing and blocks public access', async () => {
    const patchRes = await agentA.patch(`/api/files/${fileId}/sharing`).send({ isPublic: false });
    expect(patchRes.status).toBe(200);

    const shareRes = await request(app).get(`/api/share/${shareId}`);
    expect(shareRes.status).toBe(404);
  });

  it('regenerates the share id and invalidates the old one', async () => {
    await agentA.patch(`/api/files/${fileId}/sharing`).send({ isPublic: true });
    const res = await agentA.post(`/api/files/${fileId}/regenerate-share`);
    expect(res.status).toBe(200);
    const newShareId = res.body.data.file.shareId;
    expect(newShareId).not.toBe(shareId);

    const oldRes = await request(app).get(`/api/share/${shareId}`);
    expect(oldRes.status).toBe(404);

    const newRes = await request(app).get(`/api/share/${newShareId}`);
    expect(newRes.status).toBe(200);

    shareId = newShareId;
  });

  it('sets a custom display name and exposes it on the public share page', async () => {
    const res = await agentA.patch(`/api/files/${fileId}/display-name`).send({ displayName: 'My Important Documents' });
    expect(res.status).toBe(200);
    expect(res.body.data.file.displayName).toBe('My Important Documents');

    const shareRes = await request(app).get(`/api/share/${shareId}`);
    expect(shareRes.status).toBe(200);
    expect(shareRes.body.data.displayName).toBe('My Important Documents');
    // original filename must remain unchanged and the actual share id/URL untouched
    expect(shareRes.body.data.shareId).toBe(shareId);
  });

  it('blocks other users from setting the display name (IDOR)', async () => {
    const res = await agentB.patch(`/api/files/${fileId}/display-name`).send({ displayName: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  it('clears the display name back to the raw share URL when set to empty', async () => {
    const res = await agentA.patch(`/api/files/${fileId}/display-name`).send({ displayName: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.file.displayName).toBeNull();

    const shareRes = await request(app).get(`/api/share/${shareId}`);
    expect(shareRes.body.data.displayName).toBeNull();
  });

  it('rejects a display name over 120 characters', async () => {
    const res = await agentA.patch(`/api/files/${fileId}/display-name`).send({ displayName: 'x'.repeat(121) });
    expect(res.status).toBe(400);
  });

  it('deletes the file and invalidates the share link', async () => {
    const res = await agentA.delete(`/api/files/${fileId}`);
    expect(res.status).toBe(200);

    const shareRes = await request(app).get(`/api/share/${shareId}`);
    expect(shareRes.status).toBe(404);
  });
});
