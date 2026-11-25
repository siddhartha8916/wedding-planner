import type {
  CreateCategoryPayload,
  CreateExpensePayload,
  CreatePaymentPayload,
  ExpenseListFilters,
  SaveWeddingPayload,
  UpdateCategoryPayload,
  UpdateExpensePayload,
} from '../../types/api.ts';
import type { Category, Expense, PaymentRecord, WeddingProfile } from '../../types/wedding.ts';
import { computeExpenseMetrics } from '../../utils/calculations.ts';
import { simulateLatency } from './delay.ts';
import { defaultMockDb, type MockDb } from './mockDb.ts';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createMockHandlers(db: MockDb = defaultMockDb, latencyMs?: number) {
  return {
    wedding: {
      async get(): Promise<WeddingProfile> {
        await simulateLatency(latencyMs);
        return db.read().profile;
      },

      async save(payload: SaveWeddingPayload): Promise<WeddingProfile> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const now = new Date().toISOString();
        const updated: WeddingProfile = {
          ...snapshot.profile,
          brideName: payload.brideName.trim(),
          groomName: payload.groomName.trim(),
          weddingDate: payload.weddingDate,
          totalBudget: Math.max(0, Math.round(payload.totalBudget)),
          contingencyPercent: Math.max(0, Math.min(50, payload.contingencyPercent)),
          isOnboarded: payload.isOnboarded ?? snapshot.profile.isOnboarded,
          updatedAt: now,
        };
        db.write({ ...snapshot, profile: updated });
        return updated;
      },

      async seedDemo(): Promise<WeddingProfile> {
        await simulateLatency(latencyMs);
        const seeded = db.seedDemo();
        return seeded.profile;
      },

      async resetAll(): Promise<WeddingProfile> {
        await simulateLatency(latencyMs);
        const fresh = db.reset();
        return fresh.profile;
      },
    },

    categories: {
      async list(): Promise<Category[]> {
        await simulateLatency(latencyMs);
        return db.read().categories.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      },

      async getById(id: string): Promise<Category | null> {
        await simulateLatency(latencyMs);
        return db.read().categories.find((cat) => cat.id === id) ?? null;
      },

      async create(payload: CreateCategoryPayload): Promise<Category> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const now = new Date().toISOString();
        const nextOrder =
          snapshot.categories.length > 0
            ? Math.max(...snapshot.categories.map((c) => c.sortOrder)) + 1
            : 0;
        const created: Category = {
          id: makeId('cat'),
          weddingId: snapshot.profile.id,
          name: payload.name.trim(),
          description: payload.description?.trim() || undefined,
          icon: payload.icon,
          allocatedBudget:
            payload.allocatedBudget && payload.allocatedBudget > 0
              ? Math.round(payload.allocatedBudget)
              : undefined,
          sortOrder: nextOrder,
          createdAt: now,
        };
        db.write({
          ...snapshot,
          categories: [...snapshot.categories, created],
        });
        return created;
      },

      async update(id: string, payload: UpdateCategoryPayload): Promise<Category> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const index = snapshot.categories.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error(`Category ${id} not found`);
        }
        const current = snapshot.categories[index]!;
        const updated: Category = {
          ...current,
          name: payload.name !== undefined ? payload.name.trim() : current.name,
          description:
            payload.description !== undefined
              ? payload.description.trim() || undefined
              : current.description,
          icon: payload.icon ?? current.icon,
          allocatedBudget:
            payload.allocatedBudget !== undefined
              ? payload.allocatedBudget > 0
                ? Math.round(payload.allocatedBudget)
                : undefined
              : current.allocatedBudget,
        };
        const categories = snapshot.categories.slice();
        categories[index] = updated;
        db.write({ ...snapshot, categories });
        return updated;
      },

      async remove(id: string): Promise<void> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        db.write({
          ...snapshot,
          categories: snapshot.categories.filter((c) => c.id !== id),
          expenses: snapshot.expenses.filter((e) => e.categoryId !== id),
        });
      },
    },

    expenses: {
      async list(filters: ExpenseListFilters = {}): Promise<Expense[]> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const query = filters.search?.trim().toLowerCase() ?? '';

        return snapshot.expenses.filter((exp) => {
          if (filters.categoryId && exp.categoryId !== filters.categoryId) {
            return false;
          }
          if (filters.ceremony && filters.ceremony !== 'all') {
            if ((exp.ceremony ?? 'general') !== filters.ceremony) return false;
          }
          if (filters.status && filters.status !== 'all') {
            if (computeExpenseMetrics(exp).status !== filters.status) return false;
          }
          if (filters.paidBy && filters.paidBy !== 'all') {
            const hasSide = exp.payments.some((p) => p.paidBy === filters.paidBy);
            if (!hasSide) return false;
          }
          if (query) {
            const haystack = [exp.title, exp.description ?? '', exp.vendorName ?? '']
              .join(' ')
              .toLowerCase();
            if (!haystack.includes(query)) return false;
          }
          return true;
        });
      },

      async getById(id: string): Promise<Expense | null> {
        await simulateLatency(latencyMs);
        return db.read().expenses.find((exp) => exp.id === id) ?? null;
      },

      async create(payload: CreateExpensePayload): Promise<Expense> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const now = new Date().toISOString();
        const expenseId = makeId('exp');

        const payments: PaymentRecord[] = [];
        if (payload.advancePayment && payload.advancePayment.amount > 0) {
          payments.push({
            id: makeId('pay'),
            expenseId,
            amount: Math.round(payload.advancePayment.amount),
            paidDate: payload.advancePayment.paidDate,
            label: payload.advancePayment.label.trim() || 'Advance Deposit',
            method: payload.advancePayment.method,
            paidBy: payload.advancePayment.paidBy,
            note: payload.advancePayment.note?.trim() || undefined,
          });
        }

        const created: Expense = {
          id: expenseId,
          weddingId: snapshot.profile.id,
          categoryId: payload.categoryId,
          title: payload.title.trim(),
          description: payload.description?.trim() || undefined,
          estimatedAmount: Math.max(0, Math.round(payload.estimatedAmount)),
          dueDate: payload.dueDate || undefined,
          ceremony: payload.ceremony ?? 'general',
          vendorName: payload.vendorName?.trim() || undefined,
          vendorPhone: payload.vendorPhone?.trim() || undefined,
          payments,
          createdAt: now,
          updatedAt: now,
        };

        db.write({
          ...snapshot,
          expenses: [created, ...snapshot.expenses],
        });
        return created;
      },

      async update(id: string, payload: UpdateExpensePayload): Promise<Expense> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const index = snapshot.expenses.findIndex((e) => e.id === id);
        if (index === -1) {
          throw new Error(`Expense ${id} not found`);
        }
        const current = snapshot.expenses[index]!;
        const updated: Expense = {
          ...current,
          categoryId: payload.categoryId ?? current.categoryId,
          title: payload.title !== undefined ? payload.title.trim() : current.title,
          description:
            payload.description !== undefined
              ? payload.description.trim() || undefined
              : current.description,
          estimatedAmount:
            payload.estimatedAmount !== undefined
              ? Math.max(0, Math.round(payload.estimatedAmount))
              : current.estimatedAmount,
          dueDate: payload.dueDate !== undefined ? payload.dueDate || undefined : current.dueDate,
          ceremony: payload.ceremony ?? current.ceremony,
          vendorName:
            payload.vendorName !== undefined
              ? payload.vendorName.trim() || undefined
              : current.vendorName,
          vendorPhone:
            payload.vendorPhone !== undefined
              ? payload.vendorPhone.trim() || undefined
              : current.vendorPhone,
          updatedAt: new Date().toISOString(),
        };
        const expenses = snapshot.expenses.slice();
        expenses[index] = updated;
        db.write({ ...snapshot, expenses });
        return updated;
      },

      async remove(id: string): Promise<void> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        db.write({
          ...snapshot,
          expenses: snapshot.expenses.filter((e) => e.id !== id),
        });
      },
    },

    payments: {
      async create(expenseId: string, payload: CreatePaymentPayload): Promise<Expense> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const index = snapshot.expenses.findIndex((e) => e.id === expenseId);
        if (index === -1) {
          throw new Error(`Expense ${expenseId} not found`);
        }
        const current = snapshot.expenses[index]!;
        const record: PaymentRecord = {
          id: makeId('pay'),
          expenseId,
          amount: Math.max(1, Math.round(payload.amount)),
          paidDate: payload.paidDate,
          label: payload.label.trim() || 'Installment',
          method: payload.method,
          paidBy: payload.paidBy,
          note: payload.note?.trim() || undefined,
        };
        const updated: Expense = {
          ...current,
          payments: [...current.payments, record],
          updatedAt: new Date().toISOString(),
        };
        const expenses = snapshot.expenses.slice();
        expenses[index] = updated;
        db.write({ ...snapshot, expenses });
        return updated;
      },

      async remove(expenseId: string, paymentId: string): Promise<Expense> {
        await simulateLatency(latencyMs);
        const snapshot = db.read();
        const index = snapshot.expenses.findIndex((e) => e.id === expenseId);
        if (index === -1) {
          throw new Error(`Expense ${expenseId} not found`);
        }
        const current = snapshot.expenses[index]!;
        const updated: Expense = {
          ...current,
          payments: current.payments.filter((p) => p.id !== paymentId),
          updatedAt: new Date().toISOString(),
        };
        const expenses = snapshot.expenses.slice();
        expenses[index] = updated;
        db.write({ ...snapshot, expenses });
        return updated;
      },
    },
  };
}

export const mockHandlers = createMockHandlers();
