import { env } from '../config/env.ts';
import type { CreatePaymentPayload } from '../types/api.ts';
import type { Expense } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';
import { mockHandlers } from './mock/handlers.ts';

export const paymentService = {
  create(expenseId: string, payload: CreatePaymentPayload): Promise<Expense> {
    if (env.useMockApi) return mockHandlers.payments.create(expenseId, payload);
    return apiRequest<Expense>(`/expenses/${expenseId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  remove(expenseId: string, paymentId: string): Promise<Expense> {
    if (env.useMockApi) return mockHandlers.payments.remove(expenseId, paymentId);
    return apiRequest<Expense>(`/expenses/${expenseId}/payments/${paymentId}`, {
      method: 'DELETE',
    });
  },
};
