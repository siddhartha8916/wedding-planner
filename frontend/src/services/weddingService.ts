import type { SaveWeddingPayload } from '../types/api.ts';
import type { WeddingProfile } from '../types/wedding.ts';
import { apiRequest } from './apiClient.ts';

export const weddingService = {
  get(): Promise<WeddingProfile> {
    return apiRequest<WeddingProfile>('/wedding');
  },

  save(payload: SaveWeddingPayload): Promise<WeddingProfile> {
    return apiRequest<WeddingProfile>('/wedding', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  resetAll(): Promise<WeddingProfile> {
    return apiRequest<WeddingProfile>('/wedding/reset', {
      method: 'POST',
    });
  },
};
