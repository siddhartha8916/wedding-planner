import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2 } from 'lucide-react';
import { CEREMONY_OPTIONS } from '../config/presets.ts';
import { useDashboardSummary } from '../hooks/useDashboardSummary.ts';
import type { ExpenseWithMetrics } from '../types/summary.ts';
import type { CeremonyTag } from '../types/wedding.ts';
import { formatINR } from '../utils/currency.ts';
import { formatDisplayDate, getTodayIso } from '../utils/date.ts';
import { RecordPaymentModal } from '../components/expenses/RecordPaymentModal.tsx';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';

type GroupMode = 'timeline' | 'category';

const ceremonyMap = new Map(CEREMONY_OPTIONS.map((c) => [c.value, c.label]));

export function UpcomingPaymentsPage() {
  const { summary, categories, isLoading } = useDashboardSummary();

  const [groupBy, setGroupBy] = useState<GroupMode>('timeline');
  const [ceremonyFilter, setCeremonyFilter] = useState<CeremonyTag | 'all'>('all');
  const [payingExpense, setPayingExpense] = useState<ExpenseWithMetrics | null>(null);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filteredUpcoming = useMemo(() => {
    const base = summary?.upcomingExpenses ?? [];
    return base.filter((exp) => {
      if (ceremonyFilter !== 'all' && (exp.ceremony ?? 'general') !== ceremonyFilter) {
        return false;
      }
      return true;
    });
  }, [summary?.upcomingExpenses, ceremonyFilter]);

  const groups = useMemo(() => {
    if (groupBy === 'category') {
      const byCat = new Map<string, ExpenseWithMetrics[]>();
      for (const exp of filteredUpcoming) {
        const key = categoryNameMap.get(exp.categoryId) ?? 'Other';
        const existing = byCat.get(key) ?? [];
        existing.push(exp);
        byCat.set(key, existing);
      }
      return Array.from(byCat.entries()).map(([label, items]) => ({ label, items }));
    }

    const todayIso = getTodayIso();
    const currentMonthPrefix = todayIso.slice(0, 7);

    const overdue: ExpenseWithMetrics[] = [];
    const thisMonth: ExpenseWithMetrics[] = [];
    const later: ExpenseWithMetrics[] = [];
    const noDate: ExpenseWithMetrics[] = [];

    for (const exp of filteredUpcoming) {
      if (!exp.dueDate) {
        noDate.push(exp);
      } else if (exp.status === 'overdue') {
        overdue.push(exp);
      } else if (exp.dueDate.startsWith(currentMonthPrefix)) {
        thisMonth.push(exp);
      } else {
        later.push(exp);
      }
    }

    return [
      { label: 'Overdue', items: overdue },
      { label: 'Due This Month', items: thisMonth },
      { label: 'Upcoming Later', items: later },
      { label: 'No Due Date Set', items: noDate },
    ].filter((g) => g.items.length > 0);
  }, [filteredUpcoming, groupBy, categoryNameMap]);

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    );
  }

  const totalFilteredBalance = filteredUpcoming.reduce(
    (sum, item) => sum + item.upcomingAmount,
    0,
  );
  const overdueCount = filteredUpcoming.filter((item) => item.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upcoming Payments"
        subtitle="Chronological schedule of pending balances and overdue vendor dues."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card padding="sm">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Pending Balance
          </p>
          <p className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-botanical-gold-dark tabular-nums mt-1.5">
            {formatINR(totalFilteredBalance)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Pending Items
          </p>
          <p className="font-sans text-2xl sm:text-[26px] font-bold tracking-tight text-botanical-text tabular-nums mt-1.5">
            {filteredUpcoming.length}
          </p>
        </Card>
        <Card padding="sm" surface="ivory">
          <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-botanical-muted">
            Overdue Items
          </p>
          <p
            className={[
              'font-sans text-2xl sm:text-[26px] font-bold tracking-tight tabular-nums mt-1.5',
              overdueCount > 0 ? 'text-botanical-terracotta' : 'text-botanical-sage-dark',
            ].join(' ')}
          >
            {overdueCount}
          </p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex rounded-lg border border-botanical-beige bg-botanical-ivory/60 p-0.5 self-start">
          <button
            type="button"
            onClick={() => setGroupBy('timeline')}
            className={[
              'min-h-9.5 px-3.5 rounded-md text-xs font-medium cursor-pointer transition-colors',
              groupBy === 'timeline'
                ? 'bg-botanical-white text-botanical-text border border-botanical-beige'
                : 'text-botanical-muted hover:text-botanical-text',
            ].join(' ')}
          >
            Group by Timeline
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('category')}
            className={[
              'min-h-9.5 px-3.5 rounded-md text-xs font-medium cursor-pointer transition-colors',
              groupBy === 'category'
                ? 'bg-botanical-white text-botanical-text border border-botanical-beige'
                : 'text-botanical-muted hover:text-botanical-text',
            ].join(' ')}
          >
            Group by Category
          </button>
        </div>

        <div className="md:w-52">
          <Select
            aria-label="Filter by ceremony"
            value={ceremonyFilter}
            onChange={(e) => setCeremonyFilter(e.target.value as CeremonyTag | 'all')}
            options={[
              { value: 'all', label: 'All Ceremonies' },
              ...CEREMONY_OPTIONS.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck2 className="w-5 h-5" strokeWidth={1.5} />}
          title="All caught up"
          description="No unpaid or partial expenses match your current filters."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-botanical-text">
                  {group.label}
                </h2>
                <span className="text-xs text-botanical-muted tabular-nums">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((exp) => {
                  const categoryName = categoryNameMap.get(exp.categoryId) ?? 'Category';
                  const ceremonyLabel =
                    exp.ceremony && exp.ceremony !== 'general'
                      ? ceremonyMap.get(exp.ceremony)
                      : undefined;

                  return (
                    <Card
                      key={exp.id}
                      padding="sm"
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/categories/${exp.categoryId}`}
                            className="text-sm font-medium text-botanical-text hover:text-botanical-forest"
                          >
                            {exp.title}
                          </Link>
                          <Badge tone="neutral">{categoryName}</Badge>
                          {ceremonyLabel ? <Badge tone="sage">{ceremonyLabel}</Badge> : null}
                          {exp.status === 'overdue' ? (
                            <Badge tone="terracotta">Overdue</Badge>
                          ) : null}
                        </div>

                        <p className="text-xs text-botanical-muted tabular-nums">
                          {[
                            formatDisplayDate(exp.dueDate),
                            exp.vendorName,
                            `Total ${formatINR(exp.estimatedAmount)} · Paid ${formatINR(exp.paidAmount)}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-botanical-taupe/60 shrink-0">
                        <div className="tabular-nums md:text-right">
                          <p className="text-[11px] text-botanical-muted">Balance Due</p>
                          <p className="text-base sm:text-lg font-bold text-botanical-text">
                            {formatINR(exp.upcomingAmount)}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setPayingExpense(exp)}
                        >
                          Record Payment
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <RecordPaymentModal
        expense={payingExpense}
        onClose={() => setPayingExpense(null)}
      />
    </div>
  );
}
