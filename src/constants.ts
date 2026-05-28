/**
 * Centralized constants used across the app.
 *
 * Anything that's a hardcoded "magic string" — base URLs, allowed
 * embed hosts, default languages — belongs here so we have a single
 * place to update when providers change or new ones are added.
 */

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const TMDB_DEFAULT_POSTER_SIZE = 'w500';
export const TMDB_DEFAULT_BANNER_SIZE = 'original';

/** Origin of the vidrock embed player. Used for postMessage filtering. */
export const VIDROCK_ORIGIN = 'https://vidrock.net';

/**
 * Hosts allowed to be loaded inside the embed iframe player.
 *
 * Vidrock has rotated TLDs in the past (`.net`, `.ru`, `.to`, ...).
 * We list every variant we've seen so the allowlist isn't an outage
 * vector when they switch.
 *
 * The PlayerPage rejects any `type=embed` URL whose host isn't on this
 * list, including subdomain matches. Direct stream URLs (mp4/m3u8) are
 * not bound to this list since they're served over CDNs we don't
 * control, but they're still required to be https.
 */
export const EMBED_HOST_ALLOWLIST = [
  'vidrock.net',
  'vidrock.ru',
  'vidrock.to',
] as const;

/**
 * Returns true if the URL is acceptable to load in our player.
 *
 *  - Both http and https URLs are valid syntactically, but we require
 *    https in practice to avoid mixed-content issues.
 *  - For `type=embed`, the host must equal or be a subdomain of one of
 *    the entries in EMBED_HOST_ALLOWLIST.
 */
export function isAllowedPlayerUrl(rawUrl: string, type?: string | null): boolean {
  if (!rawUrl) return false;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (type === 'embed') {
    const host = url.hostname.toLowerCase();
    return EMBED_HOST_ALLOWLIST.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  }
  return true;
}

/** Default language code used when prompting users for subtitle uploads. */
export const DEFAULT_SUBTITLE_LANG = 'id';

/** Throttle/save intervals for the player progress hook. */
export const VIDROCK_SAVE_INTERVAL_MS = 15_000;
export const VIDROCK_LOCAL_STORAGE_THROTTLE_MS = 3_000;

/** Amount of seconds the keyboard arrow shortcuts seek by. */
export const PLAYER_SEEK_SECONDS = 10;

/**
 * Donation platforms shown on /donate. The URLs are read from build-time
 * env vars so deployments can swap them without a code change. Empty
 * URLs are filtered out at render time, so unset platforms simply don't
 * appear.
 */
export const DONATION_PLATFORMS = [
  {
    name: 'Trakteer',
    url: import.meta.env.VITE_DONATE_TRAKTEER || '',
    color: 'from-red-500 to-pink-500',
    description: 'Donasi sekali atau berlangganan via Trakteer.id',
  },
  {
    name: 'Saweria',
    url: import.meta.env.VITE_DONATE_SAWERIA || '',
    color: 'from-yellow-500 to-orange-500',
    description: 'Saweria — favorit kreator Indonesia',
  },
  {
    name: 'Ko-fi',
    url: import.meta.env.VITE_DONATE_KOFI || '',
    color: 'from-sky-500 to-blue-600',
    description: 'Ko-fi — international, dapat bayar via PayPal/kartu',
  },
] as const;

/** Email used for "contact admin" links on the donation page. */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'gmail@nicola.id';
