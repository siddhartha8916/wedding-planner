import { SignJWT } from 'jose';
import { MongoClient } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';

const TEST_MONGODB_URI = 'mongodb://127.0.0.1:27017/?serverSelectionTimeoutMS=3000';
const TEST_DB_NAME = 'wedding_planner_test';
const TEST_JWT_SECRET = 'test-secret-key-with-at-least-32-bytes';

let worker: Unstable_DevWorker;

async function withTestDb<T>(fn: (db: ReturnType<MongoClient['db']>) => Promise<T>): Promise<T> {
  const client = new MongoClient(TEST_MONGODB_URI);
  await client.connect();
  try {
    return await fn(client.db(TEST_DB_NAME));
  } finally {
    await client.close();
  }
}

async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  return (await worker.fetch(path, init as Parameters<Unstable_DevWorker['fetch']>[1])) as unknown as Response;
}

async function loginAndGetHeaders(): Promise<Record<string, string>> {
  const res = await workerFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'siddhartha', password: 'sidd@1996' }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { accessToken: string };
  return { Authorization: `Bearer ${body.accessToken}` };
}

describe('Cloudflare Worker API (workerd + MongoDB)', () => {
  beforeAll(async () => {
    await withTestDb(async (db) => {
      await Promise.all([
        db.collection('users').deleteMany({}),
        db.collection('weddings').deleteMany({}),
        db.collection('categories').deleteMany({}),
        db.collection('expenses').deleteMany({}),
      ]);
    });

    worker = await unstable_dev('./src/index.ts', {
      config: './wrangler.jsonc',
      vars: {
        MONGODB_URI: TEST_MONGODB_URI,
        MONGODB_DB_NAME: TEST_DB_NAME,
        JWT_SECRET: TEST_JWT_SECRET,
        JWT_EXPIRE_MINUTES: '10080',
        CORS_ORIGINS: 'http://localhost:5173',
        SEED_USERNAME: 'siddhartha',
        SEED_PASSWORD: 'sidd@1996',
      },
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  beforeEach(async () => {
    await withTestDb(async (db) => {
      await Promise.all([
        db.collection('weddings').deleteMany({}),
        db.collection('categories').deleteMany({}),
        db.collection('expenses').deleteMany({}),
      ]);
    });
  });

  it('returns /health ok and seeds default user idempotently', async () => {
    const res = await workerFetch('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' });

    await withTestDb(async (db) => {
      const user = await db.collection('users').findOne({ username: 'siddhartha' });
      expect(user).not.toBeNull();
      expect(user?.password).toBe('sidd@1996');
      expect(String(user?._id).startsWith('usr-')).toBe(true);
    });
  });

  it('handles login, non-ASCII passwords, /auth/me, expired JWTs, and unauthenticated 401s', async () => {
    const headers = await loginAndGetHeaders();

    const meRes = await workerFetch('/api/v1/auth/me', { headers });
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as { id: string; username: string };
    expect(me.username).toBe('siddhartha');

    const badPass = await workerFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'siddhartha', password: 'wrong' }),
    });
    expect(badPass.status).toBe(401);

    const nonAscii = await workerFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'siddhartha', password: 'sidd₹1996' }),
    });
    expect(nonAscii.status).toBe(401);

    const expiredJwt = await new SignJWT({ username: 'siddhartha' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(me.id)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(TEST_JWT_SECRET));

    const expiredRes = await workerFetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${expiredJwt}` },
    });
    expect(expiredRes.status).toBe(401);

    expect((await workerFetch('/api/v1/wedding')).status).toBe(401);
    expect((await workerFetch('/api/v1/categories')).status).toBe(401);
    expect((await workerFetch('/api/v1/expenses')).status).toBe(401);
  });

  it('bootstraps, saves, concurrently initializes, and resets wedding without deleting user', async () => {
    const headers = await loginAndGetHeaders();

    const [r1, r2] = await Promise.all([
      workerFetch('/api/v1/wedding', { headers }),
      workerFetch('/api/v1/wedding', { headers }),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const w1 = (await r1.json()) as { id: string; isOnboarded: boolean; currency: string };
    const w2 = (await r2.json()) as { id: string };
    expect(w1.id).toBe(w2.id);
    expect(w1.isOnboarded).toBe(false);
    expect(w1.currency).toBe('INR');

    const saved = await workerFetch('/api/v1/wedding', {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brideName: ' Aanya ',
        groomName: ' Rohan ',
        weddingDate: '2027-02-14',
        totalBudget: 3000000,
        contingencyPercent: 10,
        isOnboarded: true,
      }),
    });
    expect(saved.status).toBe(200);
    const savedBody = (await saved.json()) as { brideName: string; isOnboarded: boolean };
    expect(savedBody.brideName).toBe('Aanya');
    expect(savedBody.isOnboarded).toBe(true);

    const catRes = await workerFetch('/api/v1/categories', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Catering', icon: 'utensils' }),
    });
    expect(catRes.status).toBe(201);

    const resetRes = await workerFetch('/api/v1/wedding/reset', {
      method: 'POST',
      headers,
    });
    expect(resetRes.status).toBe(200);
    const resetBody = (await resetRes.json()) as { id: string; isOnboarded: boolean };
    expect(resetBody.isOnboarded).toBe(false);
    expect(resetBody.id).not.toBe(w1.id);

    const catsAfterReset = await workerFetch('/api/v1/categories', { headers });
    expect(await catsAfterReset.json()).toEqual([]);

    const meAfterReset = await workerFetch('/api/v1/auth/me', { headers });
    expect(meAfterReset.status).toBe(200);
  });

  it('supports categories CRUD, cascade delete, expenses filters, and payments', async () => {
    const headers = await loginAndGetHeaders();

    const cat1 = (await (
      await workerFetch('/api/v1/categories', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Catering',
          description: 'Food & sweets',
          icon: 'utensils',
          allocatedBudget: 500000,
        }),
      })
    ).json()) as { id: string; sortOrder: number };
    expect(cat1.sortOrder).toBe(0);

    const cat2 = (await (
      await workerFetch('/api/v1/categories', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Decor', icon: 'sparkles' }),
      })
    ).json()) as { id: string; sortOrder: number };
    expect(cat2.sortOrder).toBe(1);

    const clearedCat = (await (
      await workerFetch(`/api/v1/categories/${cat1.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: '', allocatedBudget: 0 }),
      })
    ).json()) as { description?: string; allocatedBudget?: number };
    expect(clearedCat.description).toBeUndefined();
    expect(clearedCat.allocatedBudget).toBeUndefined();

    const exp1 = (await (
      await workerFetch('/api/v1/expenses', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: cat1.id,
          title: 'Main Banquet & Buffet',
          description: 'Includes live counters',
          estimatedAmount: 200000,
          dueDate: '2020-01-01',
          ceremony: 'wedding',
          vendorName: 'Royal Kitchens',
          advancePayment: {
            amount: 50000,
            paidDate: '2026-11-25',
            label: 'Advance Deposit',
            method: 'upi',
          },
        }),
      })
    ).json()) as { id: string; payments: Array<{ id: string }> };
    expect(exp1.payments).toHaveLength(1);

    await workerFetch('/api/v1/expenses', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: cat2.id,
        title: 'Mandap Flowers',
        estimatedAmount: 80000,
        ceremony: 'sangeet',
        advancePayment: {
          amount: 80000,
          paidDate: '2026-11-25',
          label: 'Full',
          method: 'card',
        },
      }),
    });

    const overdue = (await (
      await workerFetch('/api/v1/expenses?status=overdue', { headers })
    ).json()) as Array<{ title: string }>;
    expect(overdue.map((e) => e.title)).toEqual(['Main Banquet & Buffet']);

    const search = (await (
      await workerFetch('/api/v1/expenses?search=royal', { headers })
    ).json()) as Array<{ title: string }>;
    expect(search.map((e) => e.title)).toEqual(['Main Banquet & Buffet']);

    const paidItems = (await (
      await workerFetch('/api/v1/expenses?status=paid', { headers })
    ).json()) as Array<{ title: string }>;
    expect(paidItems.map((e) => e.title)).toEqual(['Mandap Flowers']);

    const addPayRes = await workerFetch(`/api/v1/expenses/${exp1.id}/payments`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 25000,
        paidDate: '2026-11-26',
        label: '2nd Installment',
        method: 'cash',
      }),
    });
    expect(addPayRes.status).toBe(200);
    const afterPay = (await addPayRes.json()) as { payments: Array<{ id: string }> };
    expect(afterPay.payments).toHaveLength(2);

    const delPayRes = await workerFetch(
      `https://example.com/api/v1/expenses/${exp1.id}/payments/${afterPay.payments[1]!.id}`,
      { method: 'DELETE', headers },
    );
    expect(delPayRes.status).toBe(200);
    expect(((await delPayRes.json()) as { payments: unknown[] }).payments).toHaveLength(1);

    const delCatRes = await workerFetch(`/api/v1/categories/${cat1.id}`, {
      method: 'DELETE',
      headers,
    });
    expect(delCatRes.status).toBe(204);

    const remaining = (await (
      await workerFetch('/api/v1/expenses', { headers })
    ).json()) as Array<{ title: string }>;
    expect(remaining.map((e) => e.title)).toEqual(['Mandap Flowers']);
  });
});
