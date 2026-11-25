import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Category, Expense, WeddingProfile } from '../../types/wedding.ts';
import {
  computeCategoryMetrics,
  computeDashboardSummary,
  computeExpenseMetrics,
} from '../calculations.ts';

const baseProfile: WeddingProfile = {
  id: 'w1',
  brideName: 'Aanya',
  groomName: 'Rohan',
  weddingDate: '2027-02-14',
  totalBudget: 2500000,
  contingencyPercent: 10,
  currency: 'INR',
  isOnboarded: true,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const cateringCategory: Category = {
  id: 'cat-1',
  weddingId: 'w1',
  name: 'Catering',
  icon: 'utensils',
  allocatedBudget: 600000,
  sortOrder: 0,
  createdAt: '2026-11-01T00:00:00Z',
};

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    weddingId: 'w1',
    categoryId: 'cat-1',
    title: 'Main Banquet & Buffet',
    estimatedAmount: 200000,
    payments: [],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

describe('financial calculation utilities', () => {
  it('computes unpaid, partial, paid, and overdue statuses accurately', () => {
    const unpaid = computeExpenseMetrics(makeExpense(), '2026-11-25');
    assert.equal(unpaid.status, 'unpaid');
    assert.equal(unpaid.paidAmount, 0);
    assert.equal(unpaid.upcomingAmount, 200000);

    const partial = computeExpenseMetrics(
      makeExpense({
        dueDate: '2026-12-15',
        payments: [
          {
            id: 'p1',
            expenseId: 'exp-1',
            amount: 50000,
            paidDate: '2026-11-10',
            label: 'Advance Deposit',
            method: 'upi',
          },
        ],
      }),
      '2026-11-25',
    );
    assert.equal(partial.status, 'partial');
    assert.equal(partial.paidAmount, 50000);
    assert.equal(partial.upcomingAmount, 150000);

    const overdue = computeExpenseMetrics(
      makeExpense({
        dueDate: '2026-11-20',
        payments: [
          {
            id: 'p1',
            expenseId: 'exp-1',
            amount: 50000,
            paidDate: '2026-11-10',
            label: 'Advance Deposit',
            method: 'upi',
          },
        ],
      }),
      '2026-11-25',
    );
    assert.equal(overdue.status, 'overdue');

    const paid = computeExpenseMetrics(
      makeExpense({
        dueDate: '2026-11-20',
        payments: [
          {
            id: 'p1',
            expenseId: 'exp-1',
            amount: 200000,
            paidDate: '2026-11-18',
            label: 'Full Settlement',
            method: 'bank_transfer',
          },
        ],
      }),
      '2026-11-25',
    );
    assert.equal(paid.status, 'paid');
    assert.equal(paid.upcomingAmount, 0);
  });

  it('clamps upcomingAmount to 0 on overpayment and handles 0 estimatedAmount safely', () => {
    const overpaid = computeExpenseMetrics(
      makeExpense({
        estimatedAmount: 100000,
        payments: [
          {
            id: 'p1',
            expenseId: 'exp-1',
            amount: 120000,
            paidDate: '2026-11-10',
            label: 'Overpayment',
            method: 'upi',
          },
        ],
      }),
      '2026-11-25',
    );
    assert.equal(overpaid.upcomingAmount, 0);
    assert.equal(overpaid.status, 'paid');

    const zeroEstimate = computeExpenseMetrics(makeExpense({ estimatedAmount: 0 }), '2026-11-25');
    assert.equal(zeroEstimate.progressPercent, 0);
    assert.equal(zeroEstimate.status, 'unpaid');
  });

  it('computes category metrics and dashboard summary with zero-denominator safety', () => {
    const exp1 = makeExpense({
      id: 'e1',
      estimatedAmount: 200000,
      payments: [
        {
          id: 'p1',
          expenseId: 'e1',
          amount: 50000,
          paidDate: '2026-11-10',
          label: 'Advance',
          method: 'upi',
        },
      ],
    });
    const exp2 = makeExpense({
      id: 'e2',
      title: 'Dining Area Proper Lighting',
      estimatedAmount: 35000,
      dueDate: '2026-12-01',
      payments: [],
    });

    const catMetrics = computeCategoryMetrics(cateringCategory, [exp1, exp2], '2026-11-25');
    assert.equal(catMetrics.totalEstimated, 235000);
    assert.equal(catMetrics.totalPaid, 50000);
    assert.equal(catMetrics.totalUpcoming, 185000);
    assert.equal(catMetrics.variance, 365000);

    const summary = computeDashboardSummary(baseProfile, [cateringCategory], [exp1, exp2], '2026-11-25');
    assert.equal(summary.totalEstimated, 235000);
    assert.equal(summary.totalPaid, 50000);
    assert.equal(summary.totalUpcoming, 185000);
    assert.equal(summary.budgetLeft, 2265000);

    const zeroBudgetSummary = computeDashboardSummary(
      { ...baseProfile, totalBudget: 0 },
      [cateringCategory],
      [],
      '2026-11-25',
    );
    assert.equal(zeroBudgetSummary.paidPercentOfBudget, 0);
    assert.equal(zeroBudgetSummary.budgetLeftPercent, 0);
  });
});
