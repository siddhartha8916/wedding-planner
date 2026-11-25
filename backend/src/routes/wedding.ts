import { Hono } from 'hono';
import { withDb } from '../db.ts';
import {
  docToWedding,
  getOrBootstrapWedding,
  resetWedding,
  saveWedding,
} from '../repositories/weddingRepo.ts';
import { parseBody, saveWeddingSchema } from '../schemas/validators.ts';
import { requireAuth } from '../security.ts';
import type { AppVariables } from '../types.ts';

export const weddingRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

weddingRoutes.use('*', requireAuth);

weddingRoutes.get('/', async (c) => {
  const user = c.get('currentUser');
  const doc = await withDb(c.env, (db) => getOrBootstrapWedding(db, user.id));
  return c.json(docToWedding(doc));
});

weddingRoutes.put('/', async (c) => {
  const parsed = await parseBody(c, saveWeddingSchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const doc = await withDb(c.env, (db) => saveWedding(db, user.id, parsed.data));
  return c.json(docToWedding(doc));
});

weddingRoutes.post('/reset', async (c) => {
  const user = c.get('currentUser');
  const doc = await withDb(c.env, (db) => resetWedding(db, user.id));
  return c.json(docToWedding(doc));
});
