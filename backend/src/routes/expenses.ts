import { Hono } from 'hono';
import { withDb } from '../db.ts';
import { getCategory } from '../repositories/categoryRepo.ts';
import {
  addPayment,
  createExpense,
  deleteExpense,
  docToExpense,
  getExpense,
  listExpenses,
  removePayment,
  updateExpense,
} from '../repositories/expenseRepo.ts';
import {
  ceremonySchema,
  contributorSideSchema,
  createExpenseSchema,
  createPaymentSchema,
  expenseStatusSchema,
  parseBody,
  updateExpenseSchema,
} from '../schemas/validators.ts';
import { requireAuth } from '../security.ts';
import type { AppVariables, ContributorSide, ExpenseStatus } from '../types.ts';

export const expenseRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

expenseRoutes.use('*', requireAuth);

expenseRoutes.get('/', async (c) => {
  const user = c.get('currentUser');
  const categoryId = c.req.query('categoryId') || undefined;
  const rawStatus = c.req.query('status');
  const rawCeremony = c.req.query('ceremony');
  const rawPaidBy = c.req.query('paidBy');
  const search = c.req.query('search') || undefined;

  let status: ExpenseStatus | undefined;
  if (rawStatus && rawStatus !== 'all') {
    const parsedStatus = expenseStatusSchema.safeParse(rawStatus);
    if (!parsedStatus.success) {
      return c.json({ detail: parsedStatus.error.issues }, 422);
    }
    status = parsedStatus.data;
  }

  let ceremony: string | undefined;
  if (rawCeremony && rawCeremony !== 'all') {
    const parsedCeremony = ceremonySchema.safeParse(rawCeremony);
    if (!parsedCeremony.success) {
      return c.json({ detail: parsedCeremony.error.issues }, 422);
    }
    ceremony = parsedCeremony.data;
  }

  let paidBy: ContributorSide | undefined;
  if (rawPaidBy && rawPaidBy !== 'all') {
    const parsedPaidBy = contributorSideSchema.safeParse(rawPaidBy);
    if (!parsedPaidBy.success) {
      return c.json({ detail: parsedPaidBy.error.issues }, 422);
    }
    paidBy = parsedPaidBy.data;
  }

  const docs = await withDb(c.env, (db) =>
    listExpenses(db, user.id, { categoryId, status, ceremony, paidBy, search }),
  );
  return c.json(docs.map(docToExpense));
});

expenseRoutes.get('/:expenseId', async (c) => {
  const user = c.get('currentUser');
  const expenseId = c.req.param('expenseId');
  const doc = await withDb(c.env, (db) => getExpense(db, user.id, expenseId));
  if (!doc) {
    return c.json({ detail: `Expense ${expenseId} not found` }, 404);
  }
  return c.json(docToExpense(doc));
});

expenseRoutes.post('/', async (c) => {
  const parsed = await parseBody(c, createExpenseSchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const result = await withDb(c.env, async (db) => {
    const category = await getCategory(db, user.id, parsed.data.categoryId);
    if (!category) {
      return { notFoundCategory: parsed.data.categoryId } as const;
    }
    const doc = await createExpense(db, user.id, parsed.data);
    return { doc } as const;
  });

  if ('notFoundCategory' in result) {
    return c.json({ detail: `Category ${result.notFoundCategory} not found` }, 404);
  }
  return c.json(docToExpense(result.doc), 201);
});

expenseRoutes.patch('/:expenseId', async (c) => {
  const parsed = await parseBody(c, updateExpenseSchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const expenseId = c.req.param('expenseId');
  const result = await withDb(c.env, async (db) => {
    if (parsed.data.categoryId !== undefined) {
      const category = await getCategory(db, user.id, parsed.data.categoryId);
      if (!category) {
        return { notFoundCategory: parsed.data.categoryId } as const;
      }
    }
    const doc = await updateExpense(db, user.id, expenseId, parsed.data, parsed.rawKeys);
    return { doc } as const;
  });

  if ('notFoundCategory' in result) {
    return c.json({ detail: `Category ${result.notFoundCategory} not found` }, 404);
  }
  if (!result.doc) {
    return c.json({ detail: `Expense ${expenseId} not found` }, 404);
  }
  return c.json(docToExpense(result.doc));
});

expenseRoutes.delete('/:expenseId', async (c) => {
  const user = c.get('currentUser');
  const expenseId = c.req.param('expenseId');
  const deleted = await withDb(c.env, (db) => deleteExpense(db, user.id, expenseId));
  if (!deleted) {
    return c.json({ detail: `Expense ${expenseId} not found` }, 404);
  }
  return c.body(null, 204);
});

expenseRoutes.post('/:expenseId/payments', async (c) => {
  const parsed = await parseBody(c, createPaymentSchema);
  if (!parsed.ok) return parsed.response;

  const user = c.get('currentUser');
  const expenseId = c.req.param('expenseId');
  const doc = await withDb(c.env, (db) => addPayment(db, user.id, expenseId, parsed.data));
  if (!doc) {
    return c.json({ detail: `Expense ${expenseId} not found` }, 404);
  }
  return c.json(docToExpense(doc));
});

expenseRoutes.delete('/:expenseId/payments/:paymentId', async (c) => {
  const user = c.get('currentUser');
  const expenseId = c.req.param('expenseId');
  const paymentId = c.req.param('paymentId');

  const outcome = await withDb(c.env, (db) =>
    removePayment(db, user.id, expenseId, paymentId),
  );
  if (outcome.status === 'expense_not_found') {
    return c.json({ detail: `Expense ${expenseId} not found` }, 404);
  }
  if (outcome.status === 'payment_not_found' || !outcome.doc) {
    return c.json({ detail: `Payment ${paymentId} not found` }, 404);
  }
  return c.json(docToExpense(outcome.doc));
});
