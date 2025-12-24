import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdbService';

export function useTrendingContent(mediaType: 'movie' | 'tv' = 'movie') {
  return useQuery({
    queryKey: ['trending', mediaType],
    queryFn: () => tmdbService.getTrending(mediaType),
  });
}

export function usePopularContent(mediaType: 'movie' | 'tv' = 'movie') {
  return useQuery({
    queryKey: ['popular', mediaType],
    queryFn: () => tmdbService.getPopular(mediaType),
  });
}

export function useDiscoverContent(key: string, mediaType: 'movie' | 'tv', params: Record<string, any>) {
  return useQuery({
    queryKey: ['discover', key, mediaType],
    queryFn: () => tmdbService.discover(mediaType, params),
  });
}

export function useIndonesianContent(mediaType: 'movie' | 'tv') {
  return useDiscoverContent('indonesian', mediaType, {
    with_original_language: 'id',
    sort_by: 'popularity.desc',
  });
}

export function useGenreContent(mediaType: 'movie' | 'tv', genreId: string) {
  return useDiscoverContent(`genre-${genreId}`, mediaType, {
    with_genres: genreId,
    sort_by: 'popularity.desc',
  });
}

export function useSearchContent(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => tmdbService.search(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
  });
}

export function useContentDetails(id: number, mediaType: 'movie' | 'tv') {
  return useQuery({
    queryKey: ['content', mediaType, id],
    queryFn: () => tmdbService.getDetails(id, mediaType),
    enabled: !!id,
  });
}

export function useTVSeasons(tvId: number) {
  return useQuery({
    queryKey: ['tv-seasons', tvId],
    queryFn: () => tmdbService.getTVSeasons(tvId),
    enabled: !!tvId,
  });
}

export function useTVEpisodes(tvId: number, seasonNumber: number) {
  return useQuery({
    queryKey: ['tv-episodes', tvId, seasonNumber],
    queryFn: () => tmdbService.getTVEpisodes(tvId, seasonNumber),
    enabled: !!tvId && !!seasonNumber,
  });
}

