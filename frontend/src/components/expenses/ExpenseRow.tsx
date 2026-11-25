import { Plus } from 'lucide-react';
import { CEREMONY_OPTIONS } from '../../config/presets.ts';
import type { ExpenseWithMetrics } from '../../types/summary.ts';
import type { ExpenseStatus } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { formatDisplayDate } from '../../utils/date.ts';
import { Badge, type BadgeTone } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';

export interface ExpenseRowProps {
  expense: ExpenseWithMetrics;
  onSelect: (expense: ExpenseWithMetrics) => void;
  onRecordPayment: (expense: ExpenseWithMetrics) => void;
}

const statusBadgeMap: Record<ExpenseStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Settled', tone: 'sage' },
  partial: { label: 'Advance Paid', tone: 'gold' },
  overdue: { label: 'Overdue', tone: 'terracotta' },
  unpaid: { label: 'Unpaid', tone: 'neutral' },
};

const ceremonyLabelMap = new Map(CEREMONY_OPTIONS.map((c) => [c.value, c.label]));

export function ExpenseRow({ expense, onSelect, onRecordPayment }: ExpenseRowProps) {
  const statusInfo = statusBadgeMap[expense.status];
  const ceremonyLabel =
    expense.ceremony && expense.ceremony !== 'general'
      ? ceremonyLabelMap.get(expense.ceremony)
      : undefined;

  return (
    <div className="rounded-xl border border-botanical-beige bg-botanical-white hover:border-botanical-gold/70 transition-colors">
      {/* Mobile vertical card layout (< 768px) */}
      <div className="md:hidden p-4 space-y-3">
        <div
          onClick={() => onSelect(expense)}
          className="flex items-start justify-between gap-2.5 cursor-pointer"
        >
          <div className="min-w-0">
            <h3 className="text-base font-medium text-botanical-text leading-snug">
              {expense.title}
            </h3>
            {expense.description ? (
              <p className="text-xs text-botanical-muted line-clamp-1 mt-0.5">
                {expense.description}
              </p>
            ) : null}
          </div>
          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
        </div>

        <div
          onClick={() => onSelect(expense)}
          className="grid grid-cols-3 gap-2 rounded-lg bg-botanical-ivory/60 border border-botanical-taupe/60 p-3 cursor-pointer tabular-nums"
        >
          <div>
            <p className="text-[11px] text-botanical-muted">Total</p>
            <p className="text-sm font-bold text-botanical-text mt-0.5">
              {formatINR(expense.estimatedAmount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-botanical-muted">Paid</p>
            <p className="text-sm font-bold text-botanical-forest mt-0.5">
              {formatINR(expense.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-botanical-muted">Upcoming</p>
            <p
              className={[
                'text-sm font-bold mt-0.5',
                expense.upcomingAmount > 0
                  ? 'text-botanical-gold-dark'
                  : 'text-botanical-text-secondary',
              ].join(' ')}
            >
              {formatINR(expense.upcomingAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-botanical-muted tabular-nums min-w-0">
            {ceremonyLabel ? <Badge tone="neutral">{ceremonyLabel}</Badge> : null}
            <span className="truncate">{formatDisplayDate(expense.dueDate)}</span>
          </div>

          {expense.upcomingAmount > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              onClick={() => onRecordPayment(expense)}
            >
              Pay
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onSelect(expense)}>
              Details
            </Button>
          )}
        </div>
      </div>

      {/* Tablet & Desktop horizontal ledger row (>= 768px) */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_120px_128px_184px] md:items-center md:gap-4 px-4 py-3.5">
        <div
          onClick={() => onSelect(expense)}
          className="min-w-0 cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-botanical-text truncate hover:text-botanical-forest">
              {expense.title}
            </span>
            {ceremonyLabel ? <Badge tone="neutral">{ceremonyLabel}</Badge> : null}
          </div>
          {expense.vendorName || expense.description ? (
            <p className="text-xs text-botanical-muted truncate">
              {[expense.vendorName, expense.description].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>

        <div
          onClick={() => onSelect(expense)}
          className="text-right cursor-pointer tabular-nums whitespace-nowrap"
        >
          <p className="text-[15px] font-bold text-botanical-text">
            {formatINR(expense.estimatedAmount)}
          </p>
          <p className="text-[11px] text-botanical-muted">Total</p>
        </div>

        <div
          onClick={() => onSelect(expense)}
          className="text-right cursor-pointer tabular-nums whitespace-nowrap"
        >
          <p className="text-[15px] font-bold text-botanical-forest">
            {formatINR(expense.paidAmount)}
          </p>
          <p className="text-[11px] text-botanical-muted">
            {expense.payments.length}{' '}
            {expense.payments.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div
          onClick={() => onSelect(expense)}
          className="text-right cursor-pointer tabular-nums whitespace-nowrap"
        >
          <p
            className={[
              'text-[15px] font-bold',
              expense.upcomingAmount > 0
                ? 'text-botanical-gold-dark'
                : 'text-botanical-text-secondary',
            ].join(' ')}
          >
            {formatINR(expense.upcomingAmount)}
          </p>
          <p className="text-[11px] text-botanical-muted">
            {expense.dueDate ? formatDisplayDate(expense.dueDate) : 'No due date'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
          {expense.upcomingAmount > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              onClick={() => onRecordPayment(expense)}
            >
              Pay
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
