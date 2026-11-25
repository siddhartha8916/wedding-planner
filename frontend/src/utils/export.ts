import type { Category, Expense, WeddingProfile } from '../types/wedding.ts';
import { computeExpenseMetrics } from './calculations.ts';
import { CEREMONY_OPTIONS } from '../config/presets.ts';

function csvEscape(value: string | number | undefined): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateExpensesCSV(
  profile: WeddingProfile,
  categories: Category[],
  expenses: Expense[],
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const ceremonyMap = new Map(CEREMONY_OPTIONS.map((c) => [c.value, c.label]));

  const headers = [
    'Wedding',
    'Category',
    'Expense Title',
    'Description',
    'Ceremony',
    'Vendor Name',
    'Vendor Phone',
    'Estimated Amount (INR)',
    'Paid Amount (INR)',
    'Upcoming Balance (INR)',
    'Status',
    'Due Date',
    'Installment Count',
  ];

  const weddingLabel = `${profile.brideName} & ${profile.groomName}`;
  const rows = expenses.map((expense) => {
    const metrics = computeExpenseMetrics(expense);
    return [
      weddingLabel,
      categoryMap.get(expense.categoryId) ?? 'Uncategorized',
      expense.title,
      expense.description ?? '',
      expense.ceremony ? (ceremonyMap.get(expense.ceremony) ?? expense.ceremony) : 'General',
      expense.vendorName ?? '',
      expense.vendorPhone ?? '',
      metrics.estimatedAmount,
      metrics.paidAmount,
      metrics.upcomingAmount,
      metrics.status.toUpperCase(),
      expense.dueDate ?? '',
      expense.payments.length,
    ]
      .map(csvEscape)
      .join(',');
  });

  return [headers.map(csvEscape).join(','), ...rows].join('\r\n');
}

export function downloadCSVFile(filename: string, csvContent: string): void {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
