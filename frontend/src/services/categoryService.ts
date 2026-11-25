import type { CreateCategoryPayload, UpdateCategoryPayload } from '../types/api.ts';
import type { Category } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';

export const categoryService = {
  list(): Promise<Category[]> {
    return apiRequest<Category[]>('/categories');
  },

  getById(id: string): Promise<Category | null> {
    return apiRequest<Category | null>(`/categories/${id}`);
  },

  create(payload: CreateCategoryPayload): Promise<Category> {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    return apiRequest<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
