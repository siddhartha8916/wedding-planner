import type { CreatePaymentPayload } from '../types/api.ts';
import type { Expense } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';

export const paymentService = {
  create(expenseId: string, payload: CreatePaymentPayload): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${expenseId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  remove(expenseId: string, paymentId: string): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${expenseId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },
};
