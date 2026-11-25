import { useState } from 'react';
import { CONTRIBUTOR_SIDE_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../../config/presets.ts';
import { usePaymentMutations } from '../../hooks/useExpenses.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ExpenseWithMetrics } from '../../types/summary.ts';
import type { ContributorSide, PaymentMethod } from '../../types/wedding.ts';
import { formatINR } from '../../utils/currency.ts';
import { getTodayIso } from '../../utils/date.ts';
import { Button } from '../ui/Button.tsx';
import { CurrencyInput } from '../ui/CurrencyInput.tsx';
import { Input } from '../ui/Input.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Select } from '../ui/Select.tsx';

export interface RecordPaymentModalProps {
  expense: ExpenseWithMetrics | null;
  onClose: () => void;
  defaultSettleFull?: boolean;
}

function getInitialLabel(expense: ExpenseWithMetrics, defaultSettleFull: boolean): string {
  const installmentIndex = expense.payments.length + 1;
  if (defaultSettleFull) {
    return expense.payments.length === 0 ? 'Full Settlement' : 'Final Settlement';
  }
  if (installmentIndex === 1) return 'Advance Deposit';
  return `Installment #${installmentIndex}`;
}

function RecordPaymentModalInner({
  expense,
  onClose,
  defaultSettleFull,
}: {
  expense: ExpenseWithMetrics;
  onClose: () => void;
  defaultSettleFull: boolean;
}) {
  const { addPayment } = usePaymentMutations();
  const { showToast } = useToast();

  const [amount, setAmount] = useState(expense.upcomingAmount);
  const [paidDate, setPaidDate] = useState(() => getTodayIso());
  const [label, setLabel] = useState(() => getInitialLabel(expense, defaultSettleFull));
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [paidBy, setPaidBy] = useState<ContributorSide>('joint');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const remainingAfterPayment = Math.max(0, expense.upcomingAmount - amount);

  const handleSave = async () => {
    if (amount <= 0) {
      setError('Please enter a payment amount greater than ₹0.');
      return;
    }
    setError('');
    try {
      await addPayment.mutateAsync({
        expenseId: expense.id,
        payload: {
          amount,
          paidDate,
          label: label.trim() || 'Installment',
          method,
          paidBy,
          note: note.trim() || undefined,
        },
      });
      showToast(`Recorded ${formatINR(amount)} toward "${expense.title}".`);
      onClose();
    } catch {
      showToast('Failed to record payment. Please try again.', 'terracotta');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Record Payment"
      subtitle={`${expense.title} · Balance due: ${formatINR(expense.upcomingAmount)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={addPayment.isPending}
            onClick={handleSave}
          >
            Save Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <CurrencyInput
            label="Payment Amount"
            value={amount}
            onChange={setAmount}
            error={error}
            helperText={
              amount > 0
                ? remainingAfterPayment === 0
                  ? 'This will mark the expense as fully settled.'
                  : `Remaining balance after this payment: ${formatINR(remainingAfterPayment)}`
                : undefined
            }
          />
          {expense.upcomingAmount > 0 && amount !== expense.upcomingAmount ? (
            <button
              type="button"
              onClick={() => {
                setAmount(expense.upcomingAmount);
                setLabel('Final Settlement');
              }}
              className="text-xs font-medium text-botanical-forest hover:underline cursor-pointer"
            >
              Fill full remaining balance ({formatINR(expense.upcomingAmount)})
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment Label"
            placeholder="e.g., 2nd Installment"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            type="date"
            label="Payment Date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Payment Mode"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <Select
            label="Paid By"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value as ContributorSide)}
            options={CONTRIBUTOR_SIDE_OPTIONS}
          />
        </div>

        <Input
          label="Note (optional)"
          placeholder="Receipt #, transaction reference..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </Modal>
  );
}

export function RecordPaymentModal({
  expense,
  onClose,
  defaultSettleFull = false,
}: RecordPaymentModalProps) {
  if (!expense) return null;
  return (
    <RecordPaymentModalInner
      key={`${expense.id}-${String(defaultSettleFull)}-${expense.upcomingAmount}`}
      expense={expense}
      onClose={onClose}
      defaultSettleFull={defaultSettleFull}
    />
  );
}
