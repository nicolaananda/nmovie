import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdbService';

export interface NextEpisode {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  stillPath?: string | null;
  airDate?: string;
}

/**
 * Returns the next episode after the currently playing one, if any.
 *
 * Falls back to `null` when:
 *  - the current title is a movie (no series id, season, or episode)
 *  - the current episode is the last one in the season (we don't follow
 *    cross-season jumps to keep behavior predictable)
 *
 * Used by the player overlay to drive auto-play next.
 */
export function useNextEpisode(
  tmdbId: string,
  seasonNumber?: number,
  episodeNumber?: number,
) {
  return useQuery<NextEpisode | null>({
    queryKey: ['next-episode', tmdbId, seasonNumber, episodeNumber],
    queryFn: async () => {
      if (!tmdbId || !seasonNumber || !episodeNumber) return null;
      const episodes = await tmdbService.getTVEpisodes(parseInt(tmdbId), seasonNumber);
      if (!Array.isArray(episodes) || episodes.length === 0) return null;
      const next = episodes.find(
        (e: { episode_number: number }) => e.episode_number === episodeNumber + 1,
      );
      if (!next) return null;
      return {
        seasonNumber,
        episodeNumber: next.episode_number,
        name: next.name || `Episode ${next.episode_number}`,
        stillPath: next.still_path,
        airDate: next.air_date,
      };
    },
    enabled: Boolean(tmdbId && seasonNumber && episodeNumber),
    staleTime: 1000 * 60 * 5,
  });
}
