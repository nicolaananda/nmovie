import { useQuery } from '@tanstack/react-query';
import { providerService } from '../services/providerService';
import type { Stream } from '../types/metadata';

export function useStreams(
  contentId: string,
  type: 'movie' | 'series',
  season?: number,
  episode?: number,
) {
  const query = useQuery<Stream[]>({
    queryKey: ['streams', contentId, type, season, episode],
    queryFn: () => providerService.getStreams(contentId, type, season, episode, 'all'),
    enabled: Boolean(contentId),
    // Streams are time-sensitive (signed URLs, etc.), keep them fresh.
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });

  return {
    data: (query.data ?? []) as Stream[],
    isLoading: query.isLoading,
    // Reserved for future progressive loading from multiple providers.
    // Kept in the public API so call sites don't break.
    isLoadingMore: false,
    error: query.error,
    refetch: () => query.refetch(),
  };
}

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: () => providerService.loadProviders(),
    staleTime: 0,
  });
}
