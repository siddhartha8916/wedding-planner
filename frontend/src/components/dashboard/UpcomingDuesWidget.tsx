import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import type { ExpenseWithMetrics } from '../../types/summary.ts';
import type { Category } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { formatDisplayDate } from '../../utils/date.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';

export interface UpcomingDuesWidgetProps {
  expenses: ExpenseWithMetrics[];
  categories: Category[];
  onRecordPayment: (expense: ExpenseWithMetrics) => void;
}

export function UpcomingDuesWidget({
  expenses,
  categories,
  onRecordPayment,
}: UpcomingDuesWidgetProps) {
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  const topFive = expenses.slice(0, 5);

  return (
    <Card padding="md" className="flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-botanical-text">
              Upcoming Dues
            </h2>
            <p className="text-xs text-botanical-muted">Next pending vendor installments</p>
          </div>
          <Link
            to="/upcoming"
            className="text-xs font-medium text-botanical-forest hover:underline inline-flex items-center gap-1 min-h-[36px] whitespace-nowrap shrink-0"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {topFive.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CalendarClock
              className="w-7 h-7 text-botanical-sage mx-auto"
              strokeWidth={1.5}
            />
            <p className="text-sm text-botanical-muted">
              No pending balances right now. All committed expenses are settled.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-botanical-taupe/70">
            {topFive.map((expense) => (
              <div
                key={expense.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    to={`/categories/${expense.categoryId}`}
                    className="block text-sm font-medium text-botanical-text-secondary hover:text-botanical-forest truncate"
                  >
                    {expense.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-botanical-muted tabular-nums">
                    {expense.status === 'overdue' ? (
                      <Badge tone="terracotta">Overdue</Badge>
                    ) : null}
                    <span className="truncate">
                      {categoryNameMap.get(expense.categoryId) ?? 'Category'} ·{' '}
                      {formatDisplayDate(expense.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-sm font-semibold text-botanical-text tabular-nums">
                    {formatINR(expense.upcomingAmount)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRecordPayment(expense)}
                  >
                    Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
