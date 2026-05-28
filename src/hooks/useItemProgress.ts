import { useQuery } from '@tanstack/react-query';
import { watchHistoryService } from '../services/watchHistoryService';

interface ItemProgress {
  progress: number;
  duration?: number;
  completed: boolean;
}

/**
 * Resolved watch progress for the active selection on MetadataPage.
 * Returns 0 progress for movies the user has never started, and is
 * disabled (no fetch) for unauthenticated users.
 */
export function useItemProgress(
  tmdbId: string | undefined,
  enabled: boolean,
  seasonNumber?: number,
  episodeNumber?: number,
) {
  return useQuery<ItemProgress>({
    queryKey: ['item-progress', tmdbId, seasonNumber, episodeNumber],
    queryFn: async () => {
      const data = await watchHistoryService.getProgress(
        String(tmdbId),
        seasonNumber,
        episodeNumber,
      );
      return {
        progress: typeof data?.progress === 'number' ? data.progress : 0,
        duration: typeof data?.duration === 'number' ? data.duration : undefined,
        completed: data?.completed === true,
      };
    },
    enabled: enabled && Boolean(tmdbId),
    staleTime: 1000 * 30,
  });
}
