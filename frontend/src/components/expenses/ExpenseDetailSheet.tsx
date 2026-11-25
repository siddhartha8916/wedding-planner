import { CheckCircle2, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { CEREMONY_OPTIONS } from '../../config/presets.ts';
import { usePaymentMutations } from '../../hooks/useExpenses.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ExpenseWithMetrics } from '../../types/summary.ts';
import { formatINR } from '../../utils/currency.ts';
import { formatDisplayDate } from '../../utils/date.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { ResponsiveSheet } from '../ui/ResponsiveSheet.tsx';
import { PaymentHistoryList } from './PaymentHistoryList.tsx';

export interface ExpenseDetailSheetProps {
  expense: ExpenseWithMetrics | null;
  categoryName?: string;
  onClose: () => void;
  onEdit: (expense: ExpenseWithMetrics) => void;
  onDelete: (expense: ExpenseWithMetrics) => void;
  onOpenRecordPayment: (expense: ExpenseWithMetrics, settleFull: boolean) => void;
}

const ceremonyMap = new Map(CEREMONY_OPTIONS.map((c) => [c.value, c.label]));

export function ExpenseDetailSheet({
  expense,
  categoryName,
  onClose,
  onEdit,
  onDelete,
  onOpenRecordPayment,
}: ExpenseDetailSheetProps) {
  const { deletePayment } = usePaymentMutations();
  const { showToast } = useToast();

  if (!expense) return null;

  const handleVoidPayment = async (paymentId: string) => {
    try {
      await deletePayment.mutateAsync({ expenseId: expense.id, paymentId });
      showToast('Payment entry removed.');
    } catch {
      showToast('Could not remove payment entry.', 'terracotta');
    }
  };

  return (
    <ResponsiveSheet
      open={Boolean(expense)}
      onClose={onClose}
      title={expense.title}
      subtitle={[
        categoryName,
        expense.ceremony ? ceremonyMap.get(expense.ceremony) : undefined,
        expense.dueDate ? `Due ${formatDisplayDate(expense.dueDate)}` : undefined,
      ]
        .filter(Boolean)
        .join(' · ')}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              icon={<Pencil className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => onEdit(expense)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="w-4 h-4 text-botanical-terracotta" strokeWidth={1.5} />}
              onClick={() => onDelete(expense)}
            >
              Delete
            </Button>
          </div>

          {expense.upcomingAmount > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
                onClick={() => onOpenRecordPayment(expense, false)}
              >
                Installment
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />}
                onClick={() => onOpenRecordPayment(expense, true)}
              >
                Mark Fully Paid
              </Button>
            </div>
          ) : (
            <Badge tone="sage">Fully Settled</Badge>
          )}
        </div>
      }
    >
      {expense.description ? (
        <p className="text-sm text-botanical-text-tertiary leading-relaxed">
          {expense.description}
        </p>
      ) : null}

      <div className="rounded-xl border border-botanical-beige bg-botanical-ivory/60 p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 tabular-nums">
          <div>
            <p className="text-xs text-botanical-muted">Estimated</p>
            <p className="font-serif text-xl font-semibold text-botanical-text">
              {formatINR(expense.estimatedAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-botanical-muted">Paid</p>
            <p className="font-serif text-xl font-semibold text-botanical-forest">
              {formatINR(expense.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-botanical-muted">Upcoming</p>
            <p className="font-serif text-xl font-semibold text-botanical-gold">
              {formatINR(expense.upcomingAmount)}
            </p>
          </div>
        </div>

        <ProgressBar
          max={Math.max(expense.estimatedAmount, 1)}
          heightClass="h-2.5"
          segments={[
            { value: expense.paidAmount, colorClass: 'bg-botanical-forest', label: 'Paid' },
            {
              value: expense.upcomingAmount,
              colorClass: 'bg-botanical-gold-light',
              label: 'Upcoming',
            },
          ]}
        />
      </div>

      {expense.vendorName || expense.vendorPhone ? (
        <div className="rounded-xl border border-botanical-beige bg-botanical-white p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-botanical-muted">Vendor Contact</p>
            <p className="text-sm font-medium text-botanical-text">
              {expense.vendorName ?? 'Vendor'}
            </p>
          </div>
          {expense.vendorPhone ? (
            <a
              href={`tel:${expense.vendorPhone.replace(/\s+/g, '')}`}
              className="min-h-[40px] px-3 rounded-lg border border-botanical-beige bg-botanical-ivory/60 text-xs font-medium text-botanical-forest inline-flex items-center gap-1.5 hover:bg-botanical-surface"
            >
              <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="tabular-nums">{expense.vendorPhone}</span>
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-botanical-text-secondary">
            Payment History ({expense.payments.length})
          </h3>
          {expense.upcomingAmount > 0 ? (
            <button
              type="button"
              onClick={() => onOpenRecordPayment(expense, false)}
              className="text-xs font-medium text-botanical-forest hover:underline cursor-pointer"
            >
              + Add entry
            </button>
          ) : null}
        </div>

        <PaymentHistoryList
          payments={expense.payments}
          onDeletePayment={handleVoidPayment}
          isDeleting={deletePayment.isPending}
        />
      </div>
    </ResponsiveSheet>
  );
}
