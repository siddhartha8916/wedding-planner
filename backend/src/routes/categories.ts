import { Hono } from 'hono';
import { withDb } from '../db.ts';
import {
  createCategory,
  deleteCategory,
  docToCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '../repositories/categoryRepo.ts';
import { createCategorySchema, parseBody, updateCategorySchema } from '../schemas/validators.ts';
import { requireAuth } from '../security.ts';
import type { AppVariables } from '../types.ts';

export const categoryRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

categoryRoutes.use('*', requireAuth);

categoryRoutes.get('/', async (c) => {
  const user = c.get('currentUser');
  const docs = await withDb(c.env, (db) => listCategories(db, user.id));
  return c.json(docs.map(docToCategory));
});

categoryRoutes.get('/:categoryId', async (c) => {
  const user = c.get('currentUser');
  const categoryId = c.req.param('categoryId');
  const doc = await withDb(c.env, (db) => getCategory(db, user.id, categoryId));
  if (!doc) {
    return c.json({ detail: `Category ${categoryId} not found` }, 404);
  }
  return c.json(docToCategory(doc));
});

categoryRoutes.post('/', async (c) => {
  const parsed = await parseBody(c, createCategorySchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const doc = await withDb(c.env, (db) => createCategory(db, user.id, parsed.data));
  return c.json(docToCategory(doc), 201);
});

categoryRoutes.patch('/:categoryId', async (c) => {
  const parsed = await parseBody(c, updateCategorySchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const categoryId = c.req.param('categoryId');
  const doc = await withDb(c.env, (db) =>
    updateCategory(db, user.id, categoryId, parsed.data, parsed.rawKeys),
  );
  if (!doc) {
    return c.json({ detail: `Category ${categoryId} not found` }, 404);
  }
  return c.json(docToCategory(doc));
});

categoryRoutes.delete('/:categoryId', async (c) => {
  const user = c.get('currentUser');
  const categoryId = c.req.param('categoryId');
  const deleted = await withDb(c.env, (db) => deleteCategory(db, user.id, categoryId));
  if (!deleted) {
    return c.json({ detail: `Category ${categoryId} not found` }, 404);
  }
  return c.body(null, 204);
});
