import { useState } from 'react';
import { BarChart3, List } from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboardSummary.ts';
import { useToast } from '../hooks/useToast.ts';
import { useSaveWedding } from '../hooks/useWedding.ts';
import type { ExpenseWithMetrics } from '../types/summary.ts';
import { BudgetSummaryGrid } from '../components/dashboard/BudgetSummaryGrid.tsx';
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart.tsx';
import { CategorySummaryList } from '../components/dashboard/CategorySummaryList.tsx';
import { MasterBudgetBar } from '../components/dashboard/MasterBudgetBar.tsx';
import { UpcomingDuesWidget } from '../components/dashboard/UpcomingDuesWidget.tsx';
import { WeddingHeroBanner } from '../components/dashboard/WeddingHeroBanner.tsx';
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet.tsx';
import { RecordPaymentModal } from '../components/expenses/RecordPaymentModal.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';

export interface DashboardPageProps {
  onOpenAddExpense: () => void;
}

export function DashboardPage({ onOpenAddExpense }: DashboardPageProps) {
  const { profile, categories, summary, isLoading } = useDashboardSummary();
  const saveWedding = useSaveWedding();
  const { showToast } = useToast();

  const [breakdownView, setBreakdownView] = useState<'list' | 'chart'>('list');
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [payingExpense, setPayingExpense] = useState<ExpenseWithMetrics | null>(null);

  if (isLoading || !profile || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton variant="card" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <Skeleton variant="card" />
      </div>
    );
  }

  const handleUpdateTotalBudget = async (newBudget: number) => {
    await saveWedding.mutateAsync({
      brideName: profile.brideName,
      groomName: profile.groomName,
      weddingDate: profile.weddingDate,
      totalBudget: newBudget,
      contingencyPercent: profile.contingencyPercent,
      isOnboarded: profile.isOnboarded,
    });
    showToast('Master budget updated.');
  };

  return (
    <div className="space-y-6">
      <WeddingHeroBanner
        profile={profile}
        onAddExpense={onOpenAddExpense}
        onAddCategory={() => setCategorySheetOpen(true)}
      />

      <BudgetSummaryGrid
        summary={summary}
        onUpdateTotalBudget={handleUpdateTotalBudget}
        isSavingBudget={saveWedding.isPending}
      />

      <MasterBudgetBar summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-start gap-6">
        <Card padding="md" className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold text-botanical-text">
                Category Breakdown
              </h2>
              <p className="text-xs text-botanical-muted">
                Paid vs. upcoming spend across {categories.length}{' '}
                {categories.length === 1 ? 'category' : 'categories'}
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-botanical-beige bg-botanical-ivory/60 p-0.5">
              <button
                type="button"
                onClick={() => setBreakdownView('list')}
                aria-label="List view"
                className={[
                  'min-h-8.5 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors',
                  breakdownView === 'list'
                    ? 'bg-botanical-white text-botanical-text border border-botanical-beige'
                    : 'text-botanical-muted hover:text-botanical-text',
                ].join(' ')}
              >
                <List className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setBreakdownView('chart')}
                aria-label="Chart view"
                className={[
                  'min-h-8.5 px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors',
                  breakdownView === 'chart'
                    ? 'bg-botanical-white text-botanical-text border border-botanical-beige'
                    : 'text-botanical-muted hover:text-botanical-text',
                ].join(' ')}
              >
                <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Chart</span>
              </button>
            </div>
          </div>

          {breakdownView === 'list' ? (
            <CategorySummaryList items={summary.categoryMetrics} />
          ) : (
            <CategoryBreakdownChart items={summary.categoryMetrics} />
          )}
        </Card>

        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <UpcomingDuesWidget
            expenses={summary.upcomingExpenses}
            categories={categories}
            onRecordPayment={(expense) => setPayingExpense(expense)}
          />
        </div>
      </div>

      <CategoryFormSheet
        open={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
      />

      <RecordPaymentModal
        expense={payingExpense}
        onClose={() => setPayingExpense(null)}
      />
    </div>
  );
}
