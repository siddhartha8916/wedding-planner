import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Pencil, Plus, ReceiptText } from 'lucide-react';
import { useCategory } from '../hooks/useCategories.ts';
import { useExpenseMutations, useExpenses } from '../hooks/useExpenses.ts';
import { useToast } from '../hooks/useToast.ts';
import type { ExpenseWithMetrics } from '../types/summary.ts';
import type { CeremonyTag, Expense, ExpenseStatus } from '../types/wedding.ts';
import { computeCategoryMetrics, computeExpenseMetrics } from '../utils/calculations.ts';
import { formatINR } from '../utils/currency.ts';
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet.tsx';
import { ExpenseDetailSheet } from '../components/expenses/ExpenseDetailSheet.tsx';
import { ExpenseFilterBar } from '../components/expenses/ExpenseFilterBar.tsx';
import { ExpenseFormSheet } from '../components/expenses/ExpenseFormSheet.tsx';
import { ExpenseRow } from '../components/expenses/ExpenseRow.tsx';
import { RecordPaymentModal } from '../components/expenses/RecordPaymentModal.tsx';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { ProgressBar } from '../components/ui/ProgressBar.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';

export function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { data: category, isLoading: loadingCategory } = useCategory(categoryId);
  const { data: allCategoryExpenses = [], isLoading: loadingExpenses } = useExpenses({
    categoryId,
  });
  const { deleteExpense } = useExpenseMutations();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');
  const [ceremonyFilter, setCeremonyFilter] = useState<CeremonyTag | 'all'>('all');

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [paymentModalState, setPaymentModalState] = useState<{
    expense: ExpenseWithMetrics;
    settleFull: boolean;
  } | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseWithMetrics | null>(null);

  const enrichedExpenses = useMemo(
    () => allCategoryExpenses.map((exp) => computeExpenseMetrics(exp)),
    [allCategoryExpenses],
  );

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedExpenses.filter((exp) => {
      if (statusFilter !== 'all' && exp.status !== statusFilter) return false;
      if (ceremonyFilter !== 'all' && (exp.ceremony ?? 'general') !== ceremonyFilter) {
        return false;
      }
      if (q) {
        const text = [exp.title, exp.description ?? '', exp.vendorName ?? '']
          .join(' ')
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [enrichedExpenses, search, statusFilter, ceremonyFilter]);

  const activeDetailExpense = useMemo(
    () => enrichedExpenses.find((e) => e.id === selectedExpenseId) ?? null,
    [enrichedExpenses, selectedExpenseId],
  );

  if (loadingCategory || loadingExpenses) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    );
  }

  if (!category) {
    return (
      <EmptyState
        icon={<FolderOpen className="w-5 h-5" strokeWidth={1.5} />}
        title="Category not found"
        description="This budget category may have been removed or the link is no longer valid."
        action={
          <Link to="/categories">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" strokeWidth={1.5} />}>
              Back to Categories
            </Button>
          </Link>
        }
      />
    );
  }

  const metrics = computeCategoryMetrics(category, allCategoryExpenses);

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      showToast(`Deleted "${deletingExpense.title}".`);
      if (selectedExpenseId === deletingExpense.id) {
        setSelectedExpenseId(null);
      }
      setDeletingExpense(null);
    } catch {
      showToast('Could not delete expense.', 'terracotta');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={category.name}
        subtitle={category.description || 'Line-item expenses and installment ledger.'}
        breadcrumb={
          <div className="flex items-center gap-2 text-xs text-botanical-muted">
            <Link to="/categories" className="hover:text-botanical-forest inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
              Categories
            </Link>
            <span>/</span>
            <span className="text-botanical-text-secondary font-medium">{category.name}</span>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Pencil className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => setCategorySheetOpen(true)}
            >
              Edit Category
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => {
                setEditingExpense(null);
                setExpenseFormOpen(true);
              }}
            >
              Add Expense
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card padding="sm" surface="ivory">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Category Cap
          </p>
          <p className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-botanical-text tabular-nums mt-1.5">
            {category.allocatedBudget ? formatINR(category.allocatedBudget) : 'No cap'}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Total Committed
          </p>
          <p className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-botanical-text tabular-nums mt-1.5">
            {formatINR(metrics.totalEstimated)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Paid / Advances
          </p>
          <p className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-botanical-forest tabular-nums mt-1.5">
            {formatINR(metrics.totalPaid)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Upcoming Balance
          </p>
          <p className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-botanical-gold-dark tabular-nums mt-1.5">
            {formatINR(metrics.totalUpcoming)}
          </p>
        </Card>
      </div>

      {metrics.totalEstimated > 0 || category.allocatedBudget ? (
        <Card padding="sm" className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm tabular-nums">
            <span className="font-medium text-botanical-text-secondary">
              Category Spend Progress
            </span>
            <span className="text-botanical-text-tertiary">
              <span className="font-semibold text-botanical-forest">
                {metrics.paidPercentOfEstimated}% paid
              </span>
              {category.allocatedBudget
                ? ` · ${formatINR(category.allocatedBudget)} cap`
                : null}
            </span>
          </div>
          <ProgressBar
            max={Math.max(category.allocatedBudget ?? 0, metrics.totalEstimated, 1)}
            heightClass="h-2.5"
            segments={[
              { value: metrics.totalPaid, colorClass: 'bg-botanical-forest', label: 'Paid' },
              {
                value: metrics.totalUpcoming,
                colorClass: 'bg-botanical-gold-light',
                label: 'Upcoming',
              },
            ]}
          />
        </Card>
      ) : null}

      <ExpenseFilterBar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        ceremony={ceremonyFilter}
        onCeremonyChange={setCeremonyFilter}
      />

      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="w-5 h-5" strokeWidth={1.5} />}
          title={
            allCategoryExpenses.length === 0
              ? `No expenses in ${category.name} yet`
              : 'No matching expenses'
          }
          description={
            allCategoryExpenses.length === 0
              ? 'Add separate line items under this category, log advances, and track remaining dues.'
              : 'Try adjusting your search or filter selection.'
          }
          action={
            allCategoryExpenses.length === 0 ? (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseFormOpen(true);
                }}
              >
                Add First Expense
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onSelect={(exp) => setSelectedExpenseId(exp.id)}
              onRecordPayment={(exp) =>
                setPaymentModalState({ expense: exp, settleFull: false })
              }
            />
          ))}
        </div>
      )}

      <CategoryFormSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        editingCategory={category}
      />

      <ExpenseFormSheet
        open={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setEditingExpense(null);
        }}
        defaultCategoryId={category.id}
        editingExpense={editingExpense}
      />

      <ExpenseDetailSheet
        expense={activeDetailExpense}
        categoryName={category.name}
        onClose={() => setSelectedExpenseId(null)}
        onEdit={(exp) => {
          setSelectedExpenseId(null);
          setEditingExpense(exp);
          setExpenseFormOpen(true);
        }}
        onDelete={(exp) => setDeletingExpense(exp)}
        onOpenRecordPayment={(exp, settleFull) =>
          setPaymentModalState({ expense: exp, settleFull })
        }
      />

      <RecordPaymentModal
        expense={paymentModalState?.expense ?? null}
        defaultSettleFull={paymentModalState?.settleFull ?? false}
        onClose={() => setPaymentModalState(null)}
      />

      <Modal
        open={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        title="Delete Expense"
        subtitle={deletingExpense?.title}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteExpense.isPending}
              onClick={handleConfirmDeleteExpense}
            >
              Delete Expense
            </Button>
          </>
        }
      >
        <p className="text-sm text-botanical-text-tertiary">
          This will permanently remove this expense item and its {deletingExpense?.payments.length ?? 0}{' '}
          recorded payment entries.
        </p>
      </Modal>
    </div>
  );
}
