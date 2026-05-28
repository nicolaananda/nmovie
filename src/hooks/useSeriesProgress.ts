import { useQuery } from '@tanstack/react-query';
import { watchHistoryService, type SeriesProgressMap } from '../services/watchHistoryService';

/**
 * Per-episode watch progress for a single series, keyed by `s{N}e{N}`.
 *
 * Used by MetadataPage to render watched / in-progress markers next to
 * each episode. Disabled when `tmdbId` is empty so it doesn't fire on
 * movie pages.
 */
export function useSeriesProgress(tmdbId: string, enabled: boolean) {
  return useQuery<SeriesProgressMap>({
    queryKey: ['series-progress', tmdbId],
    queryFn: () => watchHistoryService.getSeriesProgress(tmdbId),
    enabled: enabled && Boolean(tmdbId),
    staleTime: 1000 * 30, // 30s — refresh on revisit but not on every focus
  });
}
