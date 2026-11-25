import type {
  CategoryMetrics,
  ContributorBreakdown,
  DashboardSummary,
  ExpenseWithMetrics,
} from '../types/summary.ts';
import type { Category, Expense, ExpenseStatus, WeddingProfile } from '../types/wedding.ts';
import { getTodayIso, isDateStrictlyBeforeToday } from './date.ts';

export function computeExpenseMetrics(
  expense: Expense,
  todayIso: string = getTodayIso(),
): ExpenseWithMetrics {
  const paidAmount = expense.payments.reduce(
    (sum, payment) => sum + (Number.isFinite(payment.amount) ? Math.max(0, payment.amount) : 0),
    0,
  );
  const estimated = Number.isFinite(expense.estimatedAmount) ? Math.max(0, expense.estimatedAmount) : 0;
  const upcomingAmount = Math.max(0, estimated - paidAmount);

  let status: ExpenseStatus;
  if (estimated > 0 && paidAmount >= estimated) {
    status = 'paid';
  } else if (upcomingAmount > 0 && expense.dueDate && isDateStrictlyBeforeToday(expense.dueDate, todayIso)) {
    status = 'overdue';
  } else if (paidAmount > 0 && upcomingAmount > 0) {
    status = 'partial';
  } else {
    status = 'unpaid';
  }

  const progressPercent =
    estimated > 0 ? Math.min(100, Math.round((paidAmount / estimated) * 100)) : 0;

  return {
    ...expense,
    paidAmount,
    upcomingAmount,
    progressPercent,
    status,
  };
}

export function computeCategoryMetrics(
  category: Category,
  expenses: Expense[],
  todayIso: string = getTodayIso(),
): CategoryMetrics {
  const catExpenses = expenses
    .filter((exp) => exp.categoryId === category.id)
    .map((exp) => computeExpenseMetrics(exp, todayIso));

  const totalEstimated = catExpenses.reduce((sum, exp) => sum + exp.estimatedAmount, 0);
  const totalPaid = catExpenses.reduce((sum, exp) => sum + exp.paidAmount, 0);
  const totalUpcoming = catExpenses.reduce((sum, exp) => sum + exp.upcomingAmount, 0);

  const hasCap = typeof category.allocatedBudget === 'number' && category.allocatedBudget > 0;
  const variance = hasCap ? (category.allocatedBudget ?? 0) - totalEstimated : null;
  const isOverCap = variance !== null && variance < 0;
  const paidPercentOfEstimated =
    totalEstimated > 0 ? Math.min(100, Math.round((totalPaid / totalEstimated) * 100)) : 0;

  return {
    category,
    expenseCount: catExpenses.length,
    totalEstimated,
    totalPaid,
    totalUpcoming,
    variance,
    paidPercentOfEstimated,
    isOverCap,
  };
}

export function computeDashboardSummary(
  profile: WeddingProfile,
  categories: Category[],
  expenses: Expense[],
  todayIso: string = getTodayIso(),
): DashboardSummary {
  const enriched = expenses.map((exp) => computeExpenseMetrics(exp, todayIso));

  const totalEstimated = enriched.reduce((sum, exp) => sum + exp.estimatedAmount, 0);
  const totalPaid = enriched.reduce((sum, exp) => sum + exp.paidAmount, 0);
  const totalUpcoming = enriched.reduce((sum, exp) => sum + exp.upcomingAmount, 0);

  const totalBudget = Number.isFinite(profile.totalBudget) ? Math.max(0, profile.totalBudget) : 0;
  const contingencyPercent = Number.isFinite(profile.contingencyPercent)
    ? Math.max(0, profile.contingencyPercent)
    : 0;
  const contingencyAmount = Math.round((totalBudget * contingencyPercent) / 100);
  const safeSpendableCeiling = Math.max(0, totalBudget - contingencyAmount);

  const budgetLeft = totalBudget - totalEstimated;
  const budgetLeftPercent =
    totalBudget > 0 ? Math.round((budgetLeft / totalBudget) * 100) : 0;
  const paidPercentOfEstimated =
    totalEstimated > 0 ? Math.min(100, Math.round((totalPaid / totalEstimated) * 100)) : 0;
  const paidPercentOfBudget =
    totalBudget > 0 ? Math.min(100, Math.round((totalPaid / totalBudget) * 100)) : 0;
  const upcomingPercentOfBudget =
    totalBudget > 0 ? Math.min(100, Math.round((totalUpcoming / totalBudget) * 100)) : 0;

  const contributorTotals: ContributorBreakdown = {
    joint: 0,
    bride: 0,
    groom: 0,
  };
  for (const exp of expenses) {
    for (const payment of exp.payments) {
      contributorTotals[payment.paidBy] += payment.amount;
    }
  }

  const pendingExpenses = enriched
    .filter((exp) => exp.upcomingAmount > 0)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.upcomingAmount - a.upcomingAmount;
    });

  const overdueExpenseCount = pendingExpenses.filter((exp) => exp.status === 'overdue').length;

  const categoryMetrics = categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => computeCategoryMetrics(cat, expenses, todayIso));

  return {
    totalBudget,
    contingencyPercent,
    contingencyAmount,
    safeSpendableCeiling,
    totalEstimated,
    totalPaid,
    totalUpcoming,
    budgetLeft,
    budgetLeftPercent,
    paidPercentOfEstimated,
    paidPercentOfBudget,
    upcomingPercentOfBudget,
    pendingExpenseCount: pendingExpenses.length,
    overdueExpenseCount,
    categoryMetrics,
    contributorTotals,
    upcomingExpenses: pendingExpenses,
  };
}
