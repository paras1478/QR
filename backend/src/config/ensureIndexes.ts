import { prisma } from './prisma';

interface MongoIndexInfo {
  name: string;
  key: Record<string, number>;
  unique?: boolean;
  sparse?: boolean;
}

// Prisma's `@unique` on MongoDB always creates a non-sparse unique index.
// For an optional field like User.googleId, MongoDB treats every document
// that never sets the field as having value `null`, and a non-sparse unique
// index only allows ONE such document across the whole collection. Since
// every email/password (non-Google) user never sets googleId, the first one
// ever created "claims" that slot and every registration after it fails with
// a duplicate-key error — a real production incident this app hit, surfaced
// to clients as a generic 500 on POST /api/auth/register.
//
// Prisma's schema DSL has no way to express a sparse index, so it's created/
// repaired here directly against MongoDB on startup. This is idempotent and
// cheap (a few index metadata reads), safe to run on every boot.
export async function ensureGoogleIdSparseIndex(): Promise<void> {
  const result = await prisma.$runCommandRaw({ listIndexes: 'User' });
  const cursor = (result as { cursor?: { firstBatch?: MongoIndexInfo[] } }).cursor;
  const indexes = cursor?.firstBatch ?? [];

  const googleIdIndex = indexes.find((idx) => idx.key && Object.keys(idx.key).length === 1 && 'googleId' in idx.key);

  if (googleIdIndex && googleIdIndex.unique && !googleIdIndex.sparse) {
    console.log(`[DB] Recreating non-sparse unique index "${googleIdIndex.name}" on User.googleId as sparse...`);
    await prisma.$runCommandRaw({ dropIndexes: 'User', index: googleIdIndex.name });
    await prisma.$runCommandRaw({
      createIndexes: 'User',
      indexes: [{ key: { googleId: 1 }, name: googleIdIndex.name, unique: true, sparse: true }],
    });
    console.log('[DB] User.googleId index is now sparse unique.');
  } else if (!googleIdIndex) {
    // No index at all (fresh database) — create it correctly from the start.
    await prisma.$runCommandRaw({
      createIndexes: 'User',
      indexes: [{ key: { googleId: 1 }, name: 'User_googleId_key', unique: true, sparse: true }],
    });
    console.log('[DB] Created sparse unique index on User.googleId.');
  }
}
