import { TMDB_IMAGE_BASE_URL, TMDB_DEFAULT_POSTER_SIZE } from '../constants';

/**
 * Resolves a TMDB poster reference to a full URL, regardless of whether
 * the input is already absolute (e.g. "https://image.tmdb.org/t/p/w500/abc.jpg")
 * or just the path TMDB returns (e.g. "/abc.jpg").
 *
 * Historically WatchHistory entries stored the value in both forms, which
 * led to double-prefixed URLs on render.
 */
export function resolvePosterUrl(
  poster: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = TMDB_DEFAULT_POSTER_SIZE,
): string | null {
  if (!poster) return null;
  if (poster.startsWith('http://') || poster.startsWith('https://')) {
    return poster;
  }
  // Make sure we don't end up with a double slash
  const path = poster.startsWith('/') ? poster : `/${poster}`;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Inverse of resolvePosterUrl: extracts just the path portion from a full
 * TMDB image URL. Used when bridging to APIs that expect the bare path
 * (e.g. vidrock's localStorage shape).
 */
export function extractPosterPath(poster: string | null | undefined): string {
  if (!poster) return '';
  const match = poster.match(/\/t\/p\/[^/]+(\/.+)$/);
  if (match) return match[1];
  return poster.startsWith('/') ? poster : `/${poster}`;
}
