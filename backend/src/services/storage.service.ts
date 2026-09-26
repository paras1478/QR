import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { env, checkR2Config } from '../config/env';

export interface StorageDriver {
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

class LocalStorageDriver implements StorageDriver {
  private root: string;

  constructor(root: string) {
    this.root = root;
    fs.mkdirSync(this.root, { recursive: true });
  }

  private resolveSafe(key: string): string {
    const normalized = path.normalize(key).replace(/^(\.\.[/\\])+/, '');
    const full = path.resolve(this.root, normalized);
    if (!full.startsWith(path.resolve(this.root))) {
      throw new Error('Invalid storage key');
    }
    return full;
  }

  async putObject(key: string, body: Buffer): Promise<void> {
    const full = this.resolveSafe(key);
    await fsp.mkdir(path.dirname(full), { recursive: true });
    await fsp.writeFile(full, body);
  }

  async getObject(key: string): Promise<Buffer> {
    const full = this.resolveSafe(key);
    return fsp.readFile(full);
  }

  async deleteObject(key: string): Promise<void> {
    const full = this.resolveSafe(key);
    await fsp.rm(full, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    const full = this.resolveSafe(key);
    return fs
      .promises.access(full, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }
}

function describeS3Error(err: unknown): { name: string; message: string; httpStatusCode?: number } {
  if (err && typeof err === 'object') {
    const anyErr = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    return {
      name: anyErr.name || 'UnknownError',
      message: anyErr.message || 'Unknown error',
      httpStatusCode: anyErr.$metadata?.httpStatusCode,
    };
  }
  return { name: 'UnknownError', message: String(err) };
}

class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.r2BucketName;
    // region MUST be "auto" and endpoint MUST be the bare R2 account endpoint —
    // never an AWS region/endpoint. Using an AWS S3 endpoint here would sign
    // requests against the wrong service and R2 would reject them.
    this.client = new S3Client({
      region: 'auto',
      endpoint: env.r2Endpoint,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    } catch (err) {
      const info = describeS3Error(err);
      console.error(
        `[R2] PutObject failed: ${info.name} (HTTP ${info.httpStatusCode ?? 'unknown'}) — ${info.message}. ` +
          `bucket="${this.bucket}" endpoint="${env.r2Endpoint}" key="${key}". ` +
          `If this is AccessDenied/403, the R2 API token most likely lacks write (Object Write) permission ` +
          `on this bucket — this is a Cloudflare dashboard/token issue, not an application bug.`
      );
      throw err;
    }
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const stream = result.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (err) {
      const info = describeS3Error(err);
      console.error(
        `[R2] GetObject failed: ${info.name} (HTTP ${info.httpStatusCode ?? 'unknown'}) — ${info.message}. ` +
          `bucket="${this.bucket}" key="${key}".`
      );
      throw err;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      const info = describeS3Error(err);
      console.error(
        `[R2] DeleteObject failed: ${info.name} (HTTP ${info.httpStatusCode ?? 'unknown'}) — ${info.message}. ` +
          `bucket="${this.bucket}" key="${key}".`
      );
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getObject(key);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage: StorageDriver =
  env.storageDriver === 'r2' ? new S3StorageDriver() : new LocalStorageDriver(env.localStoragePath);

export interface R2VerificationResult {
  ok: boolean;
  stage: 'config' | 'connectivity' | 'success';
  message: string;
}

/**
 * Uploads and deletes a tiny throwaway object to confirm the configured R2
 * credentials/bucket/endpoint actually allow writes, independent of any real
 * user upload. Used by the startup check and the diagnostic route.
 */
export async function verifyR2Connectivity(): Promise<R2VerificationResult> {
  const configCheck = checkR2Config();
  if (!configCheck.ok) {
    return {
      ok: false,
      stage: 'config',
      message: `Missing required R2 environment variables: ${configCheck.missing.join(', ')}`,
    };
  }

  if (env.storageDriver !== 'r2') {
    return { ok: false, stage: 'config', message: 'STORAGE_DRIVER is not set to "r2"' };
  }

  const testKey = `__health-check__/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`;

  try {
    await storage.putObject(testKey, Buffer.from('r2 connectivity check'), 'text/plain');
    await storage.deleteObject(testKey);
    return { ok: true, stage: 'success', message: 'R2 PutObject and DeleteObject both succeeded.' };
  } catch (err) {
    const info = describeS3Error(err);
    let hint = info.message;
    if (info.httpStatusCode === 403 || info.name === 'AccessDenied') {
      hint =
        'Access Denied (403) from Cloudflare R2. The application configuration (endpoint, region, bucket, ' +
        'credential source) is correct — this means the R2 API token does not have write (Object Write) ' +
        'permission on this exact bucket, or the token/bucket names do not match. Check the token\'s scope in ' +
        'the Cloudflare dashboard (R2 → Manage API Tokens) and confirm it grants Edit/Write access to ' +
        `bucket "${env.r2BucketName}".`;
    }
    return { ok: false, stage: 'connectivity', message: hint };
  }
}
