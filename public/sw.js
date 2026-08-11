/**
 * RuMax service worker.
 *
 * The offline story matters more here than for most products: a large share of our
 * students study on intermittent mobile connections, and a lesson that will not open
 * because a tunnel dropped is a lesson not studied.
 *
 * Strategy per resource class:
 *   - Navigations: network first, falling back to the cached page, then to /offline.
 *   - Static assets (/_next/static, icons): cache first — they are content-hashed.
 *   - API GETs: network first with a short-lived cache, so a reload shows the last known
 *     state rather than an error.
 *   - Anything non-GET: never cached, and never queued — replaying a submission the user
 *     could not see the result of causes more harm than the failure does.
 */

const VERSION = 'rumax-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const API_CACHE = `${VERSION}-api`;
const OFFLINE_URL = '/offline';

const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is ever served from or written to a cache.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache anything from the authenticated portals: a shared or borrowed device must
  // not be able to show the previous user's grades from cache.
  if (/^\/(portal|lecturer|admin)/.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icon')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request)),
    );
  }
});

// Allows the page to activate a waiting worker after telling the user an update is ready.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
