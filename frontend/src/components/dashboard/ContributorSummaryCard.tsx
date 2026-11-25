import { CONTRIBUTOR_SIDE_OPTIONS } from '../../config/presets.ts';
import type { ContributorBreakdown } from '../../types/summary.ts';
import { formatINR } from '../../utils/currency.ts';
import { Card } from '../ui/Card.tsx';

export interface ContributorSummaryCardProps {
  totals: ContributorBreakdown;
}

export function ContributorSummaryCard({ totals }: ContributorSummaryCardProps) {
  const grandTotal = totals.joint + totals.bride + totals.groom;
  if (grandTotal <= 0) return null;

  return (
    <Card padding="md" surface="ivory">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Paid Contributions by Side
          </h3>
          <p className="text-xs text-botanical-muted mt-0.5 tabular-nums">
            Total settled across all installments: {formatINR(grandTotal)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {CONTRIBUTOR_SIDE_OPTIONS.map((side) => {
            const amount = totals[side.value];
            const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
            return (
              <div key={side.value} className="min-w-0">
                <p className="text-xs text-botanical-muted truncate">{side.label}</p>
                <p className="text-sm font-semibold text-botanical-text tabular-nums">
                  {formatINR(amount)}
                </p>
                <p className="text-[11px] text-botanical-sage-dark tabular-nums">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
