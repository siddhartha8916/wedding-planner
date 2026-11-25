import type { Db } from 'mongodb';
import type { UserDoc } from '../types.ts';

export function getUserByUsername(db: Db, username: string): Promise<UserDoc | null> {
  return db.collection<UserDoc>('users').findOne({ username });
}

export function getUserById(db: Db, userId: string): Promise<UserDoc | null> {
  return db.collection<UserDoc>('users').findOne({ _id: userId });
}
