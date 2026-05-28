import type { PlayerPayload } from './playerPayload';

/**
 * Persistent cache of the last stream payload used for each (tmdbId,
 * season, episode) tuple. Lets the Continue Watching cards launch
 * playback in one click instead of routing through MetadataPage just to
 * resolve the source again.
 *
 * Trade-off: stream URLs from third-party providers can rotate or expire
 * on a server restart, so we age entries out and the player still
 * gracefully falls back to "no source" if the URL has gone bad.
 */

const KEY = 'last-stream-cache';
const MAX_ENTRIES = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface Entry {
  payload: PlayerPayload;
  savedAt: number;
}

type Cache = Record<string, Entry>;

function makeKey(tmdbId: string | undefined, season?: number, episode?: number) {
  if (!tmdbId) return '';
  return `${tmdbId}:${season ?? 0}:${episode ?? 0}`;
}

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded or storage disabled — ignore; the user just won't
    // get the direct-play shortcut.
  }
}

/** Save the payload for a (tmdbId, season, episode) so it can be reused later. */
export function rememberLastStream(payload: PlayerPayload) {
  const key = makeKey(payload.tmdbId, payload.season, payload.episode);
  if (!key) return;
  const cache = readCache();
  cache[key] = { payload, savedAt: Date.now() };

  // Evict the oldest entries if we're over budget.
  const entries = Object.entries(cache);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => b[1].savedAt - a[1].savedAt);
    const trimmed = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
    writeCache(trimmed);
    return;
  }
  writeCache(cache);
}

/** Look up the cached payload, or null if missing/expired. */
export function recallLastStream(
  tmdbId: string,
  season?: number,
  episode?: number,
): PlayerPayload | null {
  const cache = readCache();
  const key = makeKey(tmdbId, season, episode);
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.savedAt > TTL_MS) {
    delete cache[key];
    writeCache(cache);
    return null;
  }
  return entry.payload;
}
