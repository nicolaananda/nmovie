import { useQuery } from '@tanstack/react-query';
import { watchHistoryService } from '../services/watchHistoryService';
import { tmdbService } from '../services/tmdbService';
import type { StreamingContent } from '../types/metadata';

/**
 * Personal recommendations seeded from the user's watch history.
 *
 * Strategy:
 *  1. Fetch the 5 most recently watched titles.
 *  2. For each, fetch TMDB `/recommendations`.
 *  3. Merge, dedupe by id, drop anything the user has already watched.
 *  4. Cap at 20 results.
 *
 * The hook is a no-op (returns empty array, no fetch) for unauthenticated
 * users — call sites should still mount it; conditional rendering happens
 * via the `enabled` argument.
 */
export function usePersonalRecommendations(enabled: boolean) {
  return useQuery<StreamingContent[]>({
    queryKey: ['recommendations', 'personal'],
    queryFn: async () => {
      const data = await watchHistoryService.getHistory(10, 0);
      const history = (data?.history ?? []) as Array<{
        tmdbId: string;
        type: string;
      }>;
      if (history.length === 0) return [];

      const seeds = history.slice(0, 5);
      const watchedIds = new Set(history.map((h) => `tmdb:${h.tmdbId}`));

      const results = await Promise.all(
        seeds.map((h) => {
          const tmdbType = h.type === 'movie' ? 'movie' : 'tv';
          return tmdbService.getRecommendations(tmdbType, parseInt(h.tmdbId));
        }),
      );

      const merged = new Map<string, StreamingContent>();
      for (const list of results) {
        for (const item of list) {
          if (watchedIds.has(item.id)) continue;
          if (!merged.has(item.id)) merged.set(item.id, item);
        }
      }
      return Array.from(merged.values()).slice(0, 20);
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes — recs don't change often
  });
}
