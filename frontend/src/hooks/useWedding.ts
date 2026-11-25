import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weddingService } from '../services/weddingService.ts';
import type { SaveWeddingPayload } from '../types/api.ts';

export const WEDDING_QUERY_KEY = ['wedding'] as const;

export function useWedding() {
  return useQuery({
    queryKey: WEDDING_QUERY_KEY,
    queryFn: () => weddingService.get(),
  });
}

export function useSaveWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveWeddingPayload) => weddingService.save(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(WEDDING_QUERY_KEY, updated);
    },
  });
}

export function useResetWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => weddingService.resetAll(),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
