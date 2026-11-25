import type { DashboardSummary } from '../../types/summary.ts';
import { formatINR } from '../../utils/currency.ts';
import { Card } from '../ui/Card.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';

export interface MasterBudgetBarProps {
  summary: DashboardSummary;
}

export function MasterBudgetBar({ summary }: MasterBudgetBarProps) {
  const maxTrack = Math.max(summary.totalBudget, summary.totalEstimated, 1);
  const markerPercent =
    summary.contingencyPercent > 0 && summary.totalBudget > 0
      ? Math.round((summary.safeSpendableCeiling / maxTrack) * 100)
      : undefined;

  return (
    <Card padding="md" className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-semibold text-botanical-text">
            Master Budget Allocation
          </h2>
          <p className="text-sm text-botanical-text-tertiary tabular-nums mt-0.5">
            Committed{' '}
            <span className="font-semibold text-botanical-text">
              {formatINR(summary.totalEstimated)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-botanical-text">
              {formatINR(summary.totalBudget)}
            </span>{' '}
            target
          </p>
        </div>
        {summary.contingencyPercent > 0 ? (
          <p className="text-xs sm:text-sm text-botanical-text-tertiary tabular-nums">
            Safe ceiling (after {summary.contingencyPercent}% buffer):{' '}
            <span className="font-semibold text-botanical-text">
              {formatINR(summary.safeSpendableCeiling)}
            </span>
          </p>
        ) : null}
      </div>

      <ProgressBar
        max={maxTrack}
        heightClass="h-3"
        markerPercent={markerPercent}
        markerLabel={`Safe spendable ceiling: ${formatINR(summary.safeSpendableCeiling)}`}
        segments={[
          {
            value: summary.totalPaid,
            colorClass: 'bg-botanical-forest',
            label: `Paid: ${formatINR(summary.totalPaid)}`,
          },
          {
            value: summary.totalUpcoming,
            colorClass: 'bg-botanical-gold-light',
            label: `Upcoming: ${formatINR(summary.totalUpcoming)}`,
          },
        ]}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-botanical-text-tertiary">
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-forest shrink-0" />
          <span>Paid</span>
          <span className="font-semibold text-botanical-forest">
            {formatINR(summary.totalPaid)}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-gold-light shrink-0" />
          <span>Upcoming</span>
          <span className="font-semibold text-botanical-gold-dark">
            {formatINR(summary.totalUpcoming)}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-surface border border-botanical-beige shrink-0" />
          <span>{summary.budgetLeft >= 0 ? 'Remaining' : 'Over Budget'}</span>
          <span
            className={[
              'font-semibold',
              summary.budgetLeft >= 0 ? 'text-botanical-text' : 'text-botanical-terracotta',
            ].join(' ')}
          >
            {formatINR(Math.abs(summary.budgetLeft))}
          </span>
        </span>
      </div>
    </Card>
  );
}
