import { useMemo } from 'react';
import { computeDashboardSummary } from '../utils/calculations.ts';
import { useCategories } from './useCategories.ts';
import { useExpenses } from './useExpenses.ts';
import { useWedding } from './useWedding.ts';

export function useDashboardSummary() {
  const weddingQuery = useWedding();
  const categoriesQuery = useCategories();
  const expensesQuery = useExpenses();

  const isLoading =
    weddingQuery.isLoading || categoriesQuery.isLoading || expensesQuery.isLoading;

  const summary = useMemo(() => {
    if (!weddingQuery.data) return null;
    return computeDashboardSummary(
      weddingQuery.data,
      categoriesQuery.data ?? [],
      expensesQuery.data ?? [],
    );
  }, [weddingQuery.data, categoriesQuery.data, expensesQuery.data]);

  return {
    profile: weddingQuery.data,
    categories: categoriesQuery.data ?? [],
    expenses: expensesQuery.data ?? [],
    summary,
    isLoading,
  };
}
