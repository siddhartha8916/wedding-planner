import type { Db } from 'mongodb';
import { makeId, utcNowIso } from '../db.ts';
import type { Category, CategoryDoc, ExpenseDoc } from '../types.ts';
import { getOrBootstrapWedding } from './weddingRepo.ts';

export function docToCategory(doc: CategoryDoc): Category {
  const cat: Category = {
    id: doc._id,
    weddingId: doc.weddingId,
    name: doc.name,
    icon: doc.icon,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt,
  };
  if (doc.description !== undefined && doc.description !== null) {
    cat.description = doc.description;
  }
  if (doc.allocatedBudget !== undefined && doc.allocatedBudget !== null) {
    cat.allocatedBudget = doc.allocatedBudget;
  }
  return cat;
}

export function listCategories(db: Db, userId: string): Promise<CategoryDoc[]> {
  return db
    .collection<CategoryDoc>('categories')
    .find({ userId })
    .sort({ sortOrder: 1 })
    .toArray();
}

export function getCategory(db: Db, userId: string, categoryId: string): Promise<CategoryDoc | null> {
  return db.collection<CategoryDoc>('categories').findOne({ _id: categoryId, userId });
}

export async function createCategory(
  db: Db,
  userId: string,
  payload: {
    name: string;
    description?: string | null;
    icon: string;
    allocatedBudget?: number | null;
  },
): Promise<CategoryDoc> {
  const wedding = await getOrBootstrapWedding(db, userId);
  const lastDocs = await db
    .collection<CategoryDoc>('categories')
    .find({ userId })
    .sort({ sortOrder: -1 })
    .limit(1)
    .toArray();

  const nextOrder = lastDocs[0] ? lastDocs[0].sortOrder + 1 : 0;
  const allocated =
    payload.allocatedBudget !== undefined &&
    payload.allocatedBudget !== null &&
    payload.allocatedBudget > 0
      ? Math.round(payload.allocatedBudget)
      : null;

  const doc: CategoryDoc = {
    _id: makeId('cat'),
    userId,
    weddingId: wedding._id,
    name: payload.name,
    description: payload.description ?? null,
    icon: payload.icon,
    allocatedBudget: allocated,
    sortOrder: nextOrder,
    createdAt: utcNowIso(),
  };

  await db.collection<CategoryDoc>('categories').insertOne(doc);
  return doc;
}

export async function updateCategory(
  db: Db,
  userId: string,
  categoryId: string,
  payload: {
    name?: string;
    description?: string | null;
    icon?: string;
    allocatedBudget?: number | null;
  },
  rawKeys: Set<string>,
): Promise<CategoryDoc | null> {
  const current = await getCategory(db, userId, categoryId);
  if (!current) return null;

  const updates: Partial<CategoryDoc> = {};
  if (rawKeys.has('name') && payload.name !== undefined) {
    updates.name = payload.name;
  }
  if (rawKeys.has('description')) {
    updates.description = payload.description ?? null;
  }
  if (rawKeys.has('icon') && payload.icon !== undefined) {
    updates.icon = payload.icon;
  }
  if (rawKeys.has('allocatedBudget')) {
    updates.allocatedBudget =
      payload.allocatedBudget !== undefined &&
      payload.allocatedBudget !== null &&
      payload.allocatedBudget > 0
        ? Math.round(payload.allocatedBudget)
        : null;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .collection<CategoryDoc>('categories')
      .updateOne({ _id: categoryId, userId }, { $set: updates });
    return { ...current, ...updates };
  }
  return current;
}

export async function deleteCategory(db: Db, userId: string, categoryId: string): Promise<boolean> {
  const result = await db
    .collection<CategoryDoc>('categories')
    .deleteOne({ _id: categoryId, userId });
  if (result.deletedCount === 0) {
    return false;
  }
  await db.collection<ExpenseDoc>('expenses').deleteMany({ categoryId, userId });
  return true;
}
