import type {
  CreateExpensePayload,
  ExpenseListFilters,
  UpdateExpensePayload,
} from '../types/api.ts';
import type { Expense } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';

export const expenseService = {
  list(filters: ExpenseListFilters = {}): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.ceremony && filters.ceremony !== 'all') params.set('ceremony', filters.ceremony);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return apiRequest<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Expense | null> {
    return apiRequest<Expense | null>(`/expenses/${id}`);
  },

  create(payload: CreateExpensePayload): Promise<Expense> {
    return apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: UpdateExpensePayload): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
