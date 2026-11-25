import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { CategoryMetrics } from '../../types/summary.ts';
import { formatINR } from '../../utils/currency.ts';
import { CategoryIcon } from '../categories/CategoryIcon.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';

export interface CategorySummaryListProps {
  items: CategoryMetrics[];
}

export function CategorySummaryList({ items }: CategorySummaryListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-botanical-muted py-6 text-center">
        No categories yet. Add a category to begin tracking line items.
      </p>
    );
  }

  return (
    <div className="divide-y divide-botanical-taupe/70">
      {items.map((item) => {
        const trackMax = Math.max(
          item.category.allocatedBudget ?? 0,
          item.totalEstimated,
          1,
        );
        return (
          <Link
            key={item.category.id}
            to={`/categories/${item.category.id}`}
            className="py-3.5 first:pt-1 last:pb-1 flex items-center gap-3.5 group hover:bg-botanical-surface/35 -mx-2 px-2 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-botanical-ivory border border-botanical-beige flex items-center justify-center text-botanical-forest shrink-0">
              <CategoryIcon name={item.category.icon} className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-botanical-text-secondary truncate">
                  {item.category.name}
                </span>
                <span className="text-base font-bold text-botanical-text tabular-nums shrink-0">
                  {formatINR(item.totalEstimated)}
                </span>
              </div>

              <ProgressBar
                max={trackMax}
                heightClass="h-2"
                segments={[
                  { value: item.totalPaid, colorClass: 'bg-botanical-forest', label: 'Paid' },
                  {
                    value: item.totalUpcoming,
                    colorClass: 'bg-botanical-gold-light',
                    label: 'Upcoming',
                  },
                ]}
              />

              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs sm:text-[13px] text-botanical-muted tabular-nums">
                <span>
                  {item.expenseCount} {item.expenseCount === 1 ? 'item' : 'items'} · Paid{' '}
                  <span className="font-semibold text-botanical-forest">
                    {formatINR(item.totalPaid)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {item.category.allocatedBudget ? (
                    <span className="text-xs text-botanical-muted">
                      Cap {formatINR(item.category.allocatedBudget)} ·
                    </span>
                  ) : null}
                  {item.totalUpcoming > 0 ? (
                    <span className="font-semibold text-botanical-gold-dark">
                      Due {formatINR(item.totalUpcoming)}
                    </span>
                  ) : (
                    <span className="font-medium text-botanical-sage-dark">Settled</span>
                  )}
                </span>
              </div>
            </div>

            <ChevronRight
              className="w-4 h-4 text-botanical-disabled group-hover:text-botanical-text shrink-0"
              strokeWidth={1.5}
            />
          </Link>
        );
      })}
    </div>
  );
}
