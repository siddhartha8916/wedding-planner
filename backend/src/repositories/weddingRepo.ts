import type { Db } from 'mongodb';
import { makeId, utcNowIso } from '../db.ts';
import type { WeddingDoc, WeddingProfile } from '../types.ts';

function defaultWeddingDoc(userId: string): WeddingDoc {
  const now = utcNowIso();
  return {
    _id: makeId('wed'),
    userId,
    brideName: '',
    groomName: '',
    weddingDate: '',
    totalBudget: 2500000,
    contingencyPercent: 10,
    currency: 'INR',
    isOnboarded: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function docToWedding(doc: WeddingDoc): WeddingProfile {
  return {
    id: doc._id,
    brideName: doc.brideName,
    groomName: doc.groomName,
    weddingDate: doc.weddingDate,
    totalBudget: doc.totalBudget,
    contingencyPercent: doc.contingencyPercent,
    currency: 'INR',
    isOnboarded: doc.isOnboarded,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getOrBootstrapWedding(db: Db, userId: string): Promise<WeddingDoc> {
  const doc = await db.collection<WeddingDoc>('weddings').findOneAndUpdate(
    { userId },
    { $setOnInsert: defaultWeddingDoc(userId) },
    { upsert: true, returnDocument: 'after' },
  );
  if (!doc) {
    throw new Error('Failed to bootstrap wedding profile');
  }
  return doc;
}

export async function saveWedding(
  db: Db,
  userId: string,
  payload: {
    brideName: string;
    groomName: string;
    weddingDate: string;
    totalBudget: number;
    contingencyPercent: number;
    isOnboarded?: boolean | null;
  },
): Promise<WeddingDoc> {
  const current = await getOrBootstrapWedding(db, userId);
  const now = utcNowIso();
  const isOnboarded =
    payload.isOnboarded !== undefined && payload.isOnboarded !== null
      ? payload.isOnboarded
      : current.isOnboarded;

  const updatedFields = {
    brideName: payload.brideName,
    groomName: payload.groomName,
    weddingDate: payload.weddingDate,
    totalBudget: Math.max(0, Math.round(payload.totalBudget)),
    contingencyPercent: Math.max(0, Math.min(50, Math.round(payload.contingencyPercent))),
    isOnboarded,
    updatedAt: now,
  };

  await db
    .collection<WeddingDoc>('weddings')
    .updateOne({ _id: current._id }, { $set: updatedFields });

  return { ...current, ...updatedFields };
}

export async function resetWedding(db: Db, userId: string): Promise<WeddingDoc> {
  await Promise.all([
    db.collection('expenses').deleteMany({ userId }),
    db.collection('categories').deleteMany({ userId }),
    db.collection('weddings').deleteMany({ userId }),
  ]);
  const fresh = defaultWeddingDoc(userId);
  await db.collection<WeddingDoc>('weddings').insertOne(fresh);
  return fresh;
}
