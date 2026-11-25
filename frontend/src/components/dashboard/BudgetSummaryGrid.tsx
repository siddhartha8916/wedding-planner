import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Pencil } from 'lucide-react';
import type { DashboardSummary } from '../../types/summary.ts';
import { formatINR } from '../../utils/currency.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { CurrencyInput } from '../ui/CurrencyInput.tsx';
import { Modal } from '../ui/Modal.tsx';

export interface BudgetSummaryGridProps {
  summary: DashboardSummary;
  onUpdateTotalBudget: (newBudget: number) => Promise<void>;
  isSavingBudget?: boolean;
}

export function BudgetSummaryGrid({
  summary,
  onUpdateTotalBudget,
  isSavingBudget = false,
}: BudgetSummaryGridProps) {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [draftBudget, setDraftBudget] = useState(summary.totalBudget);

  const isOverBudget = summary.budgetLeft < 0;

  const openEditor = () => {
    setDraftBudget(summary.totalBudget);
    setEditOpen(true);
  };

  const handleSave = async () => {
    await onUpdateTotalBudget(draftBudget);
    setEditOpen(false);
  };

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 xl:gap-5">
        <Card padding="md" className="flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted truncate">
              Total Budget
            </span>
            <button
              type="button"
              onClick={openEditor}
              aria-label="Edit total budget"
              className="p-1.5 -m-1.5 rounded-md text-botanical-muted hover:text-botanical-text hover:bg-botanical-surface/70 cursor-pointer shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <p className="font-sans text-xl sm:text-[26px] font-bold tracking-tight text-botanical-text tabular-nums leading-tight truncate">
            {formatINR(summary.totalBudget)}
          </p>
          <p className="text-xs text-botanical-muted tabular-nums">
            {summary.contingencyPercent > 0
              ? `Includes ${summary.contingencyPercent}% buffer`
              : 'Master target'}
          </p>
        </Card>

        <Card padding="md" className="flex flex-col justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted truncate">
            Budget Left
          </span>
          <p
            className={[
              'font-sans text-xl sm:text-[26px] font-bold tracking-tight tabular-nums leading-tight truncate',
              isOverBudget ? 'text-botanical-terracotta' : 'text-botanical-text',
            ].join(' ')}
          >
            {isOverBudget ? `-${formatINR(Math.abs(summary.budgetLeft))}` : formatINR(summary.budgetLeft)}
          </p>
          <p
            className={[
              'text-xs font-medium tabular-nums',
              isOverBudget ? 'text-botanical-terracotta' : 'text-botanical-sage-dark',
            ].join(' ')}
          >
            {isOverBudget
              ? `Over by ${formatINR(Math.abs(summary.budgetLeft))}`
              : `${summary.budgetLeftPercent}% unallocated`}
          </p>
        </Card>

        <Card padding="md" className="flex flex-col justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted truncate">
            Paid So Far
          </span>
          <p className="font-sans text-xl sm:text-[26px] font-bold tracking-tight text-botanical-forest tabular-nums leading-tight truncate">
            {formatINR(summary.totalPaid)}
          </p>
          <p className="text-xs text-botanical-sage-dark tabular-nums">
            {summary.paidPercentOfEstimated}% of committed
          </p>
        </Card>

        <Card
          padding="md"
          interactive
          onClick={() => navigate('/upcoming')}
          className="flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted truncate">
              Upcoming Dues
            </span>
            <ArrowUpRight className="w-4 h-4 text-botanical-muted shrink-0" strokeWidth={1.5} />
          </div>
          <p className="font-sans text-xl sm:text-[26px] font-bold tracking-tight text-botanical-gold-dark tabular-nums leading-tight truncate">
            {formatINR(summary.totalUpcoming)}
          </p>
          <p className="text-xs text-botanical-muted tabular-nums">
            {summary.pendingExpenseCount} pending
            {summary.overdueExpenseCount > 0 ? ` · ${summary.overdueExpenseCount} overdue` : ''}
          </p>
        </Card>
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Update Master Budget"
        subtitle="Adjust your overall wedding budget ceiling."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={isSavingBudget} onClick={handleSave}>
              Save Budget
            </Button>
          </>
        }
      >
        <CurrencyInput
          label="Total Wedding Budget"
          value={draftBudget}
          onChange={setDraftBudget}
          helperText={draftBudget > 0 ? formatINR(draftBudget) : 'Enter amount in INR'}
        />
      </Modal>
    </>
  );
}
