import { Trash2 } from 'lucide-react';
import { PAYMENT_METHOD_OPTIONS } from '../../config/presets.ts';
import type { PaymentRecord } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { formatDisplayDate } from '../../utils/date.ts';
import { Badge } from '../ui/Badge.tsx';

export interface PaymentHistoryListProps {
  payments: PaymentRecord[];
  onDeletePayment: (paymentId: string) => void;
  isDeleting?: boolean;
}

const methodMap = new Map(PAYMENT_METHOD_OPTIONS.map((m) => [m.value, m.label]));

export function PaymentHistoryList({
  payments,
  onDeletePayment,
  isDeleting = false,
}: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-botanical-muted py-4 text-center rounded-xl border border-dashed border-botanical-beige">
        No payments recorded yet for this item.
      </p>
    );
  }

  return (
    <div className="divide-y divide-botanical-taupe/70 rounded-xl border border-botanical-beige bg-botanical-white">
      {payments.map((payment) => (
        <div key={payment.id} className="p-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-botanical-text">{payment.label}</span>
              <Badge tone="neutral">{methodMap.get(payment.method) ?? payment.method}</Badge>
            </div>
            <p className="text-xs text-botanical-muted tabular-nums">
              {formatDisplayDate(payment.paidDate)}
              {payment.note ? ` · ${payment.note}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-botanical-forest tabular-nums">
              {formatINR(payment.amount)}
            </span>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => onDeletePayment(payment.id)}
              aria-label={`Remove payment ${payment.label}`}
              className="min-w-9 min-h-9 rounded-lg flex items-center justify-center text-botanical-muted hover:text-botanical-terracotta hover:bg-botanical-terracotta/15 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
