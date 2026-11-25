import { useMemo, useState } from 'react';
import { FolderKanban, Plus, Search } from 'lucide-react';
import { useCategoryMutations } from '../hooks/useCategories.ts';
import { useDashboardSummary } from '../hooks/useDashboardSummary.ts';
import { useToast } from '../hooks/useToast.ts';
import type { CategoryMetrics } from '../types/summary.ts';
import type { Category } from '../types/wedding.ts';
import { CategoryCard } from '../components/categories/CategoryCard.tsx';
import { CategoryFormSheet } from '../components/categories/CategoryFormSheet.tsx';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { Select } from '../components/ui/Select.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';

type CategorySortOption = 'default' | 'highest_spend' | 'most_pending' | 'alphabetical';

export function CategoriesPage() {
  const { summary, isLoading } = useDashboardSummary();
  const { deleteCategory } = useCategoryMutations();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CategorySortOption>('default');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingMetrics, setDeletingMetrics] = useState<CategoryMetrics | null>(null);

  const filteredCategories = useMemo(() => {
    const list = summary?.categoryMetrics ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? list.filter(
          (item) =>
            item.category.name.toLowerCase().includes(q) ||
            (item.category.description ?? '').toLowerCase().includes(q),
        )
      : list.slice();

    switch (sortBy) {
      case 'highest_spend':
        return filtered.sort((a, b) => b.totalEstimated - a.totalEstimated);
      case 'most_pending':
        return filtered.sort((a, b) => b.totalUpcoming - a.totalUpcoming);
      case 'alphabetical':
        return filtered.sort((a, b) => a.category.name.localeCompare(b.category.name));
      default:
        return filtered;
    }
  }, [summary?.categoryMetrics, search, sortBy]);

  const handleConfirmDelete = async () => {
    if (!deletingMetrics) return;
    try {
      await deleteCategory.mutateAsync(deletingMetrics.category.id);
      showToast(`Deleted "${deletingMetrics.category.name}".`);
      setDeletingMetrics(null);
    } catch {
      showToast('Could not delete category.', 'terracotta');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Categories"
        subtitle="Organize expenses by wedding pillar and monitor optional caps."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
          >
            New Category
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-botanical-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full min-h-[44px] rounded-lg border border-botanical-beige bg-botanical-white pl-10 pr-3.5 py-2 text-base sm:text-sm text-botanical-text placeholder:text-botanical-disabled focus:outline-none focus:ring-2 focus:ring-botanical-forest/20 focus:border-botanical-forest"
          />
        </div>

        <div className="sm:w-52">
          <Select
            aria-label="Sort categories"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CategorySortOption)}
            options={[
              { value: 'default', label: 'Default Order' },
              { value: 'highest_spend', label: 'Highest Spend' },
              { value: 'most_pending', label: 'Most Pending' },
              { value: 'alphabetical', label: 'Alphabetical' },
            ]}
          />
        </div>
      </div>

      {filteredCategories.length === 0 && !search ? (
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" strokeWidth={1.5} />}
          title="No categories yet"
          description="Create your first wedding budget category such as Catering, Venue, or Decor."
          action={
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => {
                setEditingCategory(null);
                setFormOpen(true);
              }}
            >
              Add First Category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
          {filteredCategories.map((metrics) => (
            <CategoryCard
              key={metrics.category.id}
              metrics={metrics}
              onEdit={(cat) => {
                setEditingCategory(cat);
                setFormOpen(true);
              }}
              onDelete={(m) => setDeletingMetrics(m)}
            />
          ))}

          <button
            type="button"
            onClick={() => {
              setEditingCategory(null);
              setFormOpen(true);
            }}
            className="min-h-[168px] rounded-xl border border-dashed border-botanical-beige bg-botanical-white/50 hover:bg-botanical-white hover:border-botanical-forest/50 transition-colors p-6 flex flex-col items-center justify-center gap-2 text-botanical-muted hover:text-botanical-forest cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-botanical-ivory border border-botanical-beige flex items-center justify-center">
              <Plus className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="text-sm font-medium">Add New Category</span>
          </button>
        </div>
      )}

      <CategoryFormSheet
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
      />

      <Modal
        open={Boolean(deletingMetrics)}
        onClose={() => setDeletingMetrics(null)}
        title="Delete Category"
        subtitle={deletingMetrics?.category.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingMetrics(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteCategory.isPending}
              onClick={handleConfirmDelete}
            >
              Delete Category
            </Button>
          </>
        }
      >
        <p className="text-sm text-botanical-text-tertiary">
          {deletingMetrics && deletingMetrics.expenseCount > 0
            ? `This category currently has ${deletingMetrics.expenseCount} expense ${
                deletingMetrics.expenseCount === 1 ? 'item' : 'items'
              }. Deleting it will permanently remove those expenses and their payment records.`
            : 'Are you sure you want to delete this empty category?'}
        </p>
      </Modal>
    </div>
  );
}
