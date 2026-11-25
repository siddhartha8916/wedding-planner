import { MongoClient, type Db } from 'mongodb';
import type { CategoryDoc, ExpenseDoc, UserDoc, WeddingDoc } from './types.ts';

let bootstrappedDbName: string | null = null;

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

export function utcNowIso(): string {
  return new Date().toISOString();
}

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection<UserDoc>('users').createIndex({ username: 1 }, { unique: true }),
    db.collection<WeddingDoc>('weddings').createIndex({ userId: 1 }, { unique: true }),
    db.collection<CategoryDoc>('categories').createIndex({ userId: 1, sortOrder: 1 }),
    db.collection<ExpenseDoc>('expenses').createIndex({ userId: 1, categoryId: 1 }),
    db.collection<ExpenseDoc>('expenses').createIndex({ userId: 1, createdAt: -1 }),
  ]);
}

export async function seedDefaultUser(db: Db, env: Env): Promise<void> {
  const now = utcNowIso();
  const username = env.SEED_USERNAME || 'siddhartha';
  const password = env.SEED_PASSWORD;
  if (!password) return;

  await db.collection<UserDoc>('users').updateOne(
    { username },
    {
      $setOnInsert: {
        _id: makeId('usr'),
        username,
        password,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

export function resetBootstrapCache(): void {
  bootstrappedDbName = null;
}

export async function withDb<T>(env: Env, fn: (db: Db, client: MongoClient) => Promise<T>): Promise<T> {
  const dbName = env.MONGODB_DB_NAME || 'wedding_planner';
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(dbName);
    if (bootstrappedDbName !== dbName) {
      await ensureIndexes(db);
      await seedDefaultUser(db, env);
      bootstrappedDbName = dbName;
    }
    return await fn(db, client);
  } finally {
    await client.close();
  }
}
