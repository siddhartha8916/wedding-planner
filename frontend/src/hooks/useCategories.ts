import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService.ts';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/api.ts';
import { EXPENSES_QUERY_KEY } from './useExpenses.ts';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categoryService.list(),
  });
}

export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, categoryId],
    queryFn: () => (categoryId ? categoryService.getById(categoryId) : Promise.resolve(null)),
    enabled: Boolean(categoryId),
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoryService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      categoryService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
}
