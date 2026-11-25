import type { ExpenseDoc, ExpenseStatus } from '../types.ts';

export function computeExpenseStatus(
  expense: Pick<ExpenseDoc, 'estimatedAmount' | 'dueDate' | 'payments'>,
  todayIso: string = new Date().toISOString().slice(0, 10),
): ExpenseStatus {
  const paidAmount = (expense.payments ?? []).reduce(
    (sum, p) => sum + (Number.isFinite(p.amount) ? Math.max(0, Math.trunc(p.amount)) : 0),
    0,
  );
  const estimated = Number.isFinite(expense.estimatedAmount)
    ? Math.max(0, Math.trunc(expense.estimatedAmount))
    : 0;
  const upcomingAmount = Math.max(0, estimated - paidAmount);
  const dueDate = expense.dueDate;

  if (estimated > 0 && paidAmount >= estimated) {
    return 'paid';
  }
  if (upcomingAmount > 0 && typeof dueDate === 'string' && dueDate.length > 0 && dueDate.slice(0, 10) < todayIso.slice(0, 10)) {
    return 'overdue';
  }
  if (paidAmount > 0 && upcomingAmount > 0) {
    return 'partial';
  }
  return 'unpaid';
}
