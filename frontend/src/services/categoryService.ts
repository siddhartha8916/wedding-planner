import { env } from '../config/env.ts';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/api.ts';
import type { Category } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';
import { mockHandlers } from './mock/handlers.ts';

export const categoryService = {
  list(): Promise<Category[]> {
    if (env.useMockApi) return mockHandlers.categories.list();
    return apiRequest<Category[]>('/categories');
  },

  getById(id: string): Promise<Category | null> {
    if (env.useMockApi) return mockHandlers.categories.getById(id);
    return apiRequest<Category | null>(`/categories/${id}`);
  },

  create(payload: CreateCategoryPayload): Promise<Category> {
    if (env.useMockApi) return mockHandlers.categories.create(payload);
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    if (env.useMockApi) return mockHandlers.categories.update(id, payload);
    return apiRequest<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    if (env.useMockApi) return mockHandlers.categories.remove(id);
    return apiRequest<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
