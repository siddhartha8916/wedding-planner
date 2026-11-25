import type { Db, Filter } from 'mongodb';
import { makeId, utcNowIso } from '../db.ts';
import { computeExpenseStatus } from '../services/calculations.ts';
import type {
  CeremonyTag,
  Expense,
  ExpenseDoc,
  ExpenseStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentRecordDoc,
} from '../types.ts';
import { getOrBootstrapWedding } from './weddingRepo.ts';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function docToExpense(doc: ExpenseDoc): Expense {
  const payments: PaymentRecord[] = (doc.payments ?? []).map((p) => {
    const rec: PaymentRecord = {
      id: p.id,
      expenseId: p.expenseId,
      amount: p.amount,
      paidDate: p.paidDate,
      label: p.label,
      method: p.method,
    };
    if (p.note !== undefined && p.note !== null) {
      rec.note = p.note;
    }
    return rec;
  });

  const exp: Expense = {
    id: doc._id,
    weddingId: doc.weddingId,
    categoryId: doc.categoryId,
    title: doc.title,
    estimatedAmount: doc.estimatedAmount,
    payments,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  if (doc.description !== undefined && doc.description !== null) exp.description = doc.description;
  if (doc.dueDate !== undefined && doc.dueDate !== null) exp.dueDate = doc.dueDate;
  if (doc.ceremony !== undefined && doc.ceremony !== null) exp.ceremony = doc.ceremony;
  if (doc.vendorName !== undefined && doc.vendorName !== null) exp.vendorName = doc.vendorName;
  if (doc.vendorPhone !== undefined && doc.vendorPhone !== null) exp.vendorPhone = doc.vendorPhone;
  return exp;
}

export async function listExpenses(
  db: Db,
  userId: string,
  filters: {
    categoryId?: string;
    status?: ExpenseStatus;
    ceremony?: string;
    search?: string;
  },
): Promise<ExpenseDoc[]> {
  const andConditions: Filter<ExpenseDoc>[] = [{ userId }];

  if (filters.categoryId) {
    andConditions.push({ categoryId: filters.categoryId });
  }

  if (filters.ceremony && filters.ceremony !== 'all') {
    if (filters.ceremony === 'general') {
      andConditions.push({
        $or: [{ ceremony: 'general' }, { ceremony: null }, { ceremony: { $exists: false } }],
      });
    } else {
      andConditions.push({ ceremony: filters.ceremony as CeremonyTag });
    }
  }

  if (filters.search && filters.search.trim().length > 0) {
    const regex = { $regex: escapeRegex(filters.search.trim()), $options: 'i' };
    andConditions.push({
      $or: [{ title: regex }, { description: regex }, { vendorName: regex }],
    });
  }

  const query: Filter<ExpenseDoc> =
    andConditions.length === 1 ? andConditions[0]! : { $and: andConditions };

  const docs = await db
    .collection<ExpenseDoc>('expenses')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  if (filters.status) {
    return docs.filter((doc) => computeExpenseStatus(doc) === filters.status);
  }
  return docs;
}

export function getExpense(db: Db, userId: string, expenseId: string): Promise<ExpenseDoc | null> {
  return db.collection<ExpenseDoc>('expenses').findOne({ _id: expenseId, userId });
}

export async function createExpense(
  db: Db,
  userId: string,
  payload: {
    categoryId: string;
    title: string;
    description?: string | null;
    estimatedAmount: number;
    dueDate?: string | null;
    ceremony?: CeremonyTag | null;
    vendorName?: string | null;
    vendorPhone?: string | null;
    advancePayment?: {
      amount: number;
      paidDate: string;
      label: string;
      method: PaymentMethod;
      note?: string | null;
    } | null;
  },
): Promise<ExpenseDoc> {
  const wedding = await getOrBootstrapWedding(db, userId);
  const now = utcNowIso();
  const expenseId = makeId('exp');

  const payments: PaymentRecordDoc[] = [];
  if (payload.advancePayment && payload.advancePayment.amount > 0) {
    const adv = payload.advancePayment;
    payments.push({
      id: makeId('pay'),
      expenseId,
      amount: Math.round(adv.amount),
      paidDate: adv.paidDate,
      label: adv.label || 'Advance Deposit',
      method: adv.method,
      note: adv.note ?? null,
    });
  }

  const doc: ExpenseDoc = {
    _id: expenseId,
    userId,
    weddingId: wedding._id,
    categoryId: payload.categoryId,
    title: payload.title,
    description: payload.description ?? null,
    estimatedAmount: Math.max(0, Math.round(payload.estimatedAmount)),
    dueDate: payload.dueDate ?? null,
    ceremony: payload.ceremony ?? 'general',
    vendorName: payload.vendorName ?? null,
    vendorPhone: payload.vendorPhone ?? null,
    payments,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ExpenseDoc>('expenses').insertOne(doc);
  return doc;
}

export async function updateExpense(
  db: Db,
  userId: string,
  expenseId: string,
  payload: {
    categoryId?: string;
    title?: string;
    description?: string | null;
    estimatedAmount?: number;
    dueDate?: string | null;
    ceremony?: CeremonyTag | null;
    vendorName?: string | null;
    vendorPhone?: string | null;
  },
  rawKeys: Set<string>,
): Promise<ExpenseDoc | null> {
  const updates: Partial<ExpenseDoc> = {};
  if (rawKeys.has('categoryId') && payload.categoryId !== undefined) {
    updates.categoryId = payload.categoryId;
  }
  if (rawKeys.has('title') && payload.title !== undefined) {
    updates.title = payload.title;
  }
  if (rawKeys.has('description')) {
    updates.description = payload.description ?? null;
  }
  if (rawKeys.has('estimatedAmount') && payload.estimatedAmount !== undefined) {
    updates.estimatedAmount = Math.max(0, Math.round(payload.estimatedAmount));
  }
  if (rawKeys.has('dueDate')) {
    updates.dueDate = payload.dueDate ?? null;
  }
  if (rawKeys.has('ceremony') && payload.ceremony !== undefined && payload.ceremony !== null) {
    updates.ceremony = payload.ceremony;
  }
  if (rawKeys.has('vendorName')) {
    updates.vendorName = payload.vendorName ?? null;
  }
  if (rawKeys.has('vendorPhone')) {
    updates.vendorPhone = payload.vendorPhone ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return getExpense(db, userId, expenseId);
  }

  updates.updatedAt = utcNowIso();
  return db
    .collection<ExpenseDoc>('expenses')
    .findOneAndUpdate(
      { _id: expenseId, userId },
      { $set: updates },
      { returnDocument: 'after' },
    );
}

export async function deleteExpense(db: Db, userId: string, expenseId: string): Promise<boolean> {
  const result = await db
    .collection<ExpenseDoc>('expenses')
    .deleteOne({ _id: expenseId, userId });
  return result.deletedCount > 0;
}

export async function addPayment(
  db: Db,
  userId: string,
  expenseId: string,
  payload: {
    amount: number;
    paidDate: string;
    label: string;
    method: PaymentMethod;
    note?: string | null;
  },
): Promise<ExpenseDoc | null> {
  const record: PaymentRecordDoc = {
    id: makeId('pay'),
    expenseId,
    amount: Math.max(1, Math.round(payload.amount)),
    paidDate: payload.paidDate,
    label: payload.label || 'Installment',
    method: payload.method,
    note: payload.note ?? null,
  };

  return db.collection<ExpenseDoc>('expenses').findOneAndUpdate(
    { _id: expenseId, userId },
    {
      $push: { payments: record },
      $set: { updatedAt: utcNowIso() },
    },
    { returnDocument: 'after' },
  );
}

export async function removePayment(
  db: Db,
  userId: string,
  expenseId: string,
  paymentId: string,
): Promise<{ status: 'expense_not_found' | 'payment_not_found' | 'ok'; doc: ExpenseDoc | null }> {
  const current = await getExpense(db, userId, expenseId);
  if (!current) {
    return { status: 'expense_not_found', doc: null };
  }
  if (!current.payments.some((p) => p.id === paymentId)) {
    return { status: 'payment_not_found', doc: null };
  }

  const updated = await db.collection<ExpenseDoc>('expenses').findOneAndUpdate(
    { _id: expenseId, userId },
    {
      $pull: { payments: { id: paymentId } },
      $set: { updatedAt: utcNowIso() },
    },
    { returnDocument: 'after' },
  );
  return { status: 'ok', doc: updated };
}
