import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCreateExpensePayload } from '../expenseForm.ts';

const baseValues = {
  categoryId: 'cat-1',
  title: 'Bridal Jewelry Set',
  description: 'Kundan necklace and earrings',
  estimatedAmount: 45000,
  dueDate: '2026-12-15',
  ceremony: 'wedding' as const,
  vendorName: 'Jaipur Jewels',
  vendorPhone: '+91 98765 43210',
};

describe('buildCreateExpensePayload', () => {
  it('records full upfront payment and omits dueDate in upfront mode even if form had a stale dueDate', () => {
    const payload = buildCreateExpensePayload({
      mode: 'upfront',
      values: baseValues,
      hasAdvance: false,
      advanceAmount: 0,
      paymentDate: '2026-11-25',
      paymentMethod: 'card',
    });

    assert.equal(payload.estimatedAmount, 45000);
    assert.equal(payload.dueDate, undefined);
    assert.deepEqual(payload.advancePayment, {
      amount: 45000,
      paidDate: '2026-11-25',
      label: 'Direct Purchase',
      method: 'card',
    });
  });

  it('builds an unpaid planned expense without advancePayment when hasAdvance is false', () => {
    const payload = buildCreateExpensePayload({
      mode: 'planned',
      values: baseValues,
      hasAdvance: false,
      advanceAmount: 10000,
      paymentDate: '2026-11-25',
      paymentMethod: 'upi',
    });

    assert.equal(payload.estimatedAmount, 45000);
    assert.equal(payload.dueDate, '2026-12-15');
    assert.equal(payload.advancePayment, undefined);
  });

  it('records Advance Deposit or Full Settlement in planned mode when hasAdvance is true', () => {
    const partial = buildCreateExpensePayload({
      mode: 'planned',
      values: { ...baseValues, dueDate: '' },
      hasAdvance: true,
      advanceAmount: 15000,
      paymentDate: '2026-11-25',
      paymentMethod: 'bank_transfer',
    });

    assert.equal(partial.dueDate, undefined);
    assert.deepEqual(partial.advancePayment, {
      amount: 15000,
      paidDate: '2026-11-25',
      label: 'Advance Deposit',
      method: 'bank_transfer',
    });

    const settled = buildCreateExpensePayload({
      mode: 'planned',
      values: baseValues,
      hasAdvance: true,
      advanceAmount: 45000,
      paymentDate: '2026-11-25',
      paymentMethod: 'cash',
    });

    assert.equal(settled.advancePayment?.label, 'Full Settlement');
  });
});
