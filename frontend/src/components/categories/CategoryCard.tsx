import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import type { CategoryMetrics } from '../../types/summary.ts';
import type { Category } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { Badge } from '../ui/Badge.tsx';
import { Card } from '../ui/Card.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { CategoryIcon } from './CategoryIcon.tsx';

export interface CategoryCardProps {
  metrics: CategoryMetrics;
  onEdit: (category: Category) => void;
  onDelete: (metrics: CategoryMetrics) => void;
}

export function CategoryCard({ metrics, onEdit, onDelete }: CategoryCardProps) {
  const { category, expenseCount, totalEstimated, totalPaid, totalUpcoming, isOverCap } = metrics;
  const hasCap = typeof category.allocatedBudget === 'number' && category.allocatedBudget > 0;
  const maxTrack = Math.max(category.allocatedBudget ?? 0, totalEstimated, 1);

  return (
    <Card padding="md" className="flex flex-col justify-between gap-4 hover:border-botanical-gold/70 transition-colors">
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/categories/${category.id}`}
            className="flex items-center gap-3 min-w-0 group flex-1"
          >
            <div className="w-11 h-11 rounded-xl bg-botanical-ivory border border-botanical-beige flex items-center justify-center text-botanical-forest shrink-0">
              <CategoryIcon name={category.icon} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-semibold text-botanical-text group-hover:text-botanical-forest line-clamp-2 leading-snug">
                {category.name}
              </h3>
              <p className="text-xs text-botanical-muted tabular-nums mt-0.5">
                {expenseCount} {expenseCount === 1 ? 'expense item' : 'expense items'}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(category)}
              aria-label={`Edit ${category.name}`}
              className="min-w-9 min-h-9 rounded-lg flex items-center justify-center text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface/70 cursor-pointer"
            >
              <Pencil className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(metrics)}
              aria-label={`Delete ${category.name}`}
              className="min-w-9 min-h-9 rounded-lg flex items-center justify-center text-botanical-muted hover:text-botanical-terracotta hover:bg-botanical-terracotta/15 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <p className="text-xs text-botanical-text-tertiary line-clamp-2 min-h-8">
          {category.description || 'No description added yet.'}
        </p>

        <div className="mt-auto space-y-2 pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-sans text-2xl font-bold tracking-tight text-botanical-text tabular-nums">
              {formatINR(totalEstimated)}
            </span>
            {hasCap ? (
              <Badge tone={isOverCap ? 'terracotta' : 'neutral'} className="tabular-nums shrink-0">
                {isOverCap
                  ? `Over cap by ${formatINR(Math.abs(metrics.variance ?? 0))}`
                  : `Cap ${formatINR(category.allocatedBudget ?? 0)}`}
              </Badge>
            ) : null}
          </div>

          <ProgressBar
            max={maxTrack}
            heightClass="h-2"
            segments={[
              { value: totalPaid, colorClass: 'bg-botanical-forest', label: 'Paid' },
              { value: totalUpcoming, colorClass: 'bg-botanical-gold-light', label: 'Upcoming' },
            ]}
          />
        </div>
      </div>

      <div className="pt-3 border-t border-botanical-taupe/70 flex items-center justify-between text-xs sm:text-[13px] tabular-nums">
        <div>
          <span className="text-botanical-muted">Paid: </span>
          <span className="font-semibold text-botanical-forest">{formatINR(totalPaid)}</span>
        </div>
        <div>
          <span className="text-botanical-muted">Upcoming: </span>
          <span
            className={[
              'font-semibold',
              totalUpcoming > 0 ? 'text-botanical-gold-dark' : 'text-botanical-text-secondary',
            ].join(' ')}
          >
            {formatINR(totalUpcoming)}
          </span>
        </div>
      </div>
    </Card>
  );
}
