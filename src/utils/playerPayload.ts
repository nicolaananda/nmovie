/**
 * Player payload handoff between MetadataPage and PlayerPage.
 *
 * Why: putting the raw stream URL in the address bar (`?url=https://...`)
 * exposes the source to anyone looking at the tab, breaks neatly when
 * shared, and just looks ugly. Instead we stash the payload in
 * sessionStorage under a short token and pass only that token in the URL.
 *
 * sessionStorage bounds the lifetime to the current tab — refresh still
 * works, but closing the tab clears it. The PlayerPage falls back to the
 * old `?url=...` flow when no token is provided, so existing deep links
 * keep working.
 */

const KEY_PREFIX = 'player-payload:';

export interface PlayerPayload {
  url: string;
  type?: string;
  title?: string;
  tmdbId?: string;
  imdbId?: string;
  mediaType?: string;
  poster?: string;
  season?: number;
  episode?: number;
  subtitles?: unknown;
}

/** Stash a payload and return the opaque token to put in the URL. */
export function stashPlayerPayload(payload: PlayerPayload): string {
  const token = randomToken();
  try {
    sessionStorage.setItem(KEY_PREFIX + token, JSON.stringify(payload));
  } catch {
    // sessionStorage can throw if disabled; caller falls back to URL params.
    return '';
  }
  return token;
}

/** Read a stashed payload by token. Returns null if missing or malformed. */
export function readPlayerPayload(token: string): PlayerPayload | null {
  if (!token) return null;
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + token);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerPayload;
  } catch {
    return null;
  }
}

function randomToken(): string {
  // Use crypto.randomUUID when available, fall back to a short random
  // string for ancient browsers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 6);
}
