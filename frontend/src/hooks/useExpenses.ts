import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService.ts';
import { paymentService } from '../services/paymentService.ts';
import type {
  CreateExpensePayload,
  CreatePaymentPayload,
  ExpenseListFilters,
  UpdateExpensePayload,
} from '../types/api.ts';

export const EXPENSES_QUERY_KEY = ['expenses'] as const;

export function useExpenses(filters: ExpenseListFilters = {}) {
  return useQuery({
    queryKey: [...EXPENSES_QUERY_KEY, filters],
    queryFn: () => expenseService.list(filters),
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
  };

  const createExpense = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expenseService.create(payload),
    onSuccess: invalidate,
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      expenseService.update(id, payload),
    onSuccess: invalidate,
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expenseService.remove(id),
    onSuccess: invalidate,
  });

  return { createExpense, updateExpense, deleteExpense };
}

export function usePaymentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
  };

  const addPayment = useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: string; payload: CreatePaymentPayload }) =>
      paymentService.create(expenseId, payload),
    onSuccess: invalidate,
  });

  const deletePayment = useMutation({
    mutationFn: ({ expenseId, paymentId }: { expenseId: string; paymentId: string }) =>
      paymentService.remove(expenseId, paymentId),
    onSuccess: invalidate,
  });

  return { addPayment, deletePayment };
}
