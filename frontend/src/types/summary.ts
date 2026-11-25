import type { Category, ContributorSide, Expense, ExpenseStatus } from './wedding.ts';

export interface ExpenseWithMetrics extends Expense {
  paidAmount: number;
  upcomingAmount: number;
  progressPercent: number;
  status: ExpenseStatus;
}

export interface CategoryMetrics {
  category: Category;
  expenseCount: number;
  totalEstimated: number;
  totalPaid: number;
  totalUpcoming: number;
  variance: number | null;
  paidPercentOfEstimated: number;
  isOverCap: boolean;
}

export type ContributorBreakdown = Record<ContributorSide, number>;

export interface DashboardSummary {
  totalBudget: number;
  contingencyPercent: number;
  contingencyAmount: number;
  safeSpendableCeiling: number;
  totalEstimated: number;
  totalPaid: number;
  totalUpcoming: number;
  budgetLeft: number;
  budgetLeftPercent: number;
  paidPercentOfEstimated: number;
  paidPercentOfBudget: number;
  upcomingPercentOfBudget: number;
  pendingExpenseCount: number;
  overdueExpenseCount: number;
  categoryMetrics: CategoryMetrics[];
  contributorTotals: ContributorBreakdown;
  upcomingExpenses: ExpenseWithMetrics[];
}
