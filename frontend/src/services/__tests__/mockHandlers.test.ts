import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMockDb, type StorageLike } from '../mock/mockDb.ts';
import { createMockHandlers } from '../mock/handlers.ts';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
}

describe('Mock DB and REST handlers', () => {
  it('recovers gracefully from malformed JSON in localStorage', () => {
    const storage = createMemoryStorage({
      'bandhan_wedding_db_v1': '{broken json!!!',
    });
    const db = createMockDb(storage);
    const snapshot = db.read();
    assert.equal(snapshot.profile.isOnboarded, false);
    assert.equal(snapshot.categories.length, 0);
    assert.equal(snapshot.expenses.length, 0);
  });

  it('seeds realistic Indian wedding demo data and supports reset', async () => {
    const db = createMockDb(createMemoryStorage());
    const handlers = createMockHandlers(db, 0);

    const seeded = await handlers.wedding.seedDemo();
    assert.equal(seeded.isOnboarded, true);
    assert.equal(seeded.totalBudget, 2500000);

    const categories = await handlers.categories.list();
    assert.ok(categories.length >= 6);

    const catering = categories.find((c) => c.name.toLowerCase().includes('catering'));
    assert.ok(catering);

    const cateringExpenses = await handlers.expenses.list({ categoryId: catering.id });
    assert.ok(cateringExpenses.length >= 2);

    const reset = await handlers.wedding.resetAll();
    assert.equal(reset.isOnboarded, false);
    assert.equal((await handlers.categories.list()).length, 0);
  });

  it('creates an expense with initial advance, adds installment, voids payment, and cascades category delete', async () => {
    const db = createMockDb(createMemoryStorage());
    const handlers = createMockHandlers(db, 0);

    await handlers.wedding.save({
      brideName: 'Meera',
      groomName: 'Kabir',
      weddingDate: '2027-02-14',
      totalBudget: 2000000,
      contingencyPercent: 10,
      isOnboarded: true,
    });

    const cat = await handlers.categories.create({
      name: 'Catering',
      icon: 'utensils',
      allocatedBudget: 600000,
    });

    const exp = await handlers.expenses.create({
      categoryId: cat.id,
      title: 'Main Banquet & Buffet',
      estimatedAmount: 200000,
      ceremony: 'wedding',
      vendorName: 'Royal Kitchens',
      advancePayment: {
        amount: 50000,
        paidDate: '2026-11-25',
        label: 'Advance Deposit',
        method: 'upi',
        paidBy: 'joint',
      },
    });
    assert.equal(exp.payments.length, 1);
    assert.equal(exp.payments[0]?.amount, 50000);

    const updatedAfterInstallment = await handlers.payments.create(exp.id, {
      amount: 150000,
      paidDate: '2026-12-10',
      label: 'Final Settlement',
      method: 'bank_transfer',
      paidBy: 'bride',
    });
    assert.equal(updatedAfterInstallment.payments.length, 2);

    const paymentIdToVoid = updatedAfterInstallment.payments[1]!.id;
    const afterVoid = await handlers.payments.remove(exp.id, paymentIdToVoid);
    assert.equal(afterVoid.payments.length, 1);

    await handlers.categories.remove(cat.id);
    const remainingExpenses = await handlers.expenses.list();
    assert.equal(remainingExpenses.length, 0);
  });
});
