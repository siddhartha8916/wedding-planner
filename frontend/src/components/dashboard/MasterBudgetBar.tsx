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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <h2 className="font-serif text-xl font-semibold text-botanical-text">
            Master Budget Allocation
          </h2>
          <p className="text-xs text-botanical-muted tabular-nums">
            Committed {formatINR(summary.totalEstimated)} of {formatINR(summary.totalBudget)} target
          </p>
        </div>
        {summary.contingencyPercent > 0 ? (
          <p className="text-xs text-botanical-muted tabular-nums">
            Safe ceiling (after {summary.contingencyPercent}% buffer):{' '}
            <span className="font-medium text-botanical-text-secondary">
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

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-botanical-muted">
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-forest" />
          Paid ({formatINR(summary.totalPaid)})
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-gold-light" />
          Upcoming Committed ({formatINR(summary.totalUpcoming)})
        </span>
        <span className="inline-flex items-center gap-2 tabular-nums">
          <span className="w-2.5 h-2.5 rounded-full bg-botanical-surface border border-botanical-beige" />
          {summary.budgetLeft >= 0
            ? `Remaining (${formatINR(summary.budgetLeft)})`
            : `Over Budget (${formatINR(Math.abs(summary.budgetLeft))})`}
        </span>
      </div>
    </Card>
  );
}
