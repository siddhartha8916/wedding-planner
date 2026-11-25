import { env } from '../config/env.ts';
import type { SaveWeddingPayload } from '../types/api.ts';
import type { WeddingProfile } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';
import { mockHandlers } from './mock/handlers.ts';

export const weddingService = {
  get(): Promise<WeddingProfile> {
    if (env.useMockApi) return mockHandlers.wedding.get();
    return apiRequest<WeddingProfile>('/wedding');
  },

  save(payload: SaveWeddingPayload): Promise<WeddingProfile> {
    if (env.useMockApi) return mockHandlers.wedding.save(payload);
    return apiRequest<WeddingProfile>('/wedding', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  seedDemo(): Promise<WeddingProfile> {
    return mockHandlers.wedding.seedDemo();
  },

  resetAll(): Promise<WeddingProfile> {
    if (env.useMockApi) return mockHandlers.wedding.resetAll();
    return apiRequest<WeddingProfile>('/wedding/reset', {
      method: 'POST',
    });
  },
};
