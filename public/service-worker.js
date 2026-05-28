/* eslint-disable no-restricted-globals */
// N-Movie service worker.
//
// Strategy:
//  - App shell (HTML, JS, CSS): network-first with cache fallback so the
//    user always gets the latest deploy when online but can still load
//    the app offline.
//  - TMDB images: cache-first, capped at 100 entries via LRU.
//  - Everything else: passes through (we don't want to cache stream URLs
//    or auth-bearing API calls).

const CACHE_VERSION = 'v1';
const APP_CACHE = `nmovie-app-${CACHE_VERSION}`;
const IMG_CACHE = `nmovie-img-${CACHE_VERSION}`;
const IMG_CACHE_MAX = 100;

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // Pre-caching failures are non-fatal; runtime caching will fill in.
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== APP_CACHE && k !== IMG_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET; skip POST/PUT/DELETE etc.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't touch our own API or any cross-origin video stream.
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('vidrock.net')) return;

  // TMDB images: cache-first.
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
            trimCache(IMG_CACHE, IMG_CACHE_MAX);
          }
          return response;
        } catch (e) {
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  // App shell + assets: network-first with cache fallback.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && request.url.startsWith(self.location.origin)) {
            const cache = await caches.open(APP_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (e) {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Last resort for navigation requests: return cached index.
          if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
          }
          throw e;
        }
      })(),
    );
  }
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
