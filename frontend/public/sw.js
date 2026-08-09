/* Trackify service worker
 *
 * Bump CACHE_VERSION whenever a new frontend version is deployed so the
 * old caches are replaced and every client moves to the new version.
 *
 * Caching strategy summary:
 *  - App shell (index.html, manifest, icons, offline.html): precached on install.
 *  - Navigation requests: network-first, fall back to cached shell, then offline.html.
 *  - Same-origin static assets: cache-first, with runtime caching.
 *  - Google Fonts: cache-first (opaque responses are cached for offline).
 *  - Backend API (cross-origin, non-font): network-only. Never cached.
 *    Sensitive data such as auth tokens and API responses are never stored
 *    in Cache Storage.
 */

const CACHE_VERSION = 'trackify-v1.0.2';

const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;

const CACHE_PREFIX = 'trackify-';

const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const toUrl = (path) => new URL(path, self.location.href).toString();

const isApiRequest = (url) =>
  url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname);

const isFontRequest = (url) => FONT_HOSTS.includes(url.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Trackify push notifications (goal reminders sent from the backend).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {
      body: event.data ? event.data.text() : "Don't forget to finish your goals today!",
    };
  }

  const title = data.title || 'Trackify';
  const options = {
    body:
      data.body ||
      "Don't forget to finish your goals today!",
    icon: data.icon || toUrl('./icons/icon-192.png'),
    badge: data.badge || toUrl('./icons/icon-192.png'),
    data: { url: data.url || './goals' },
    vibrate: [100, 50, 100],
    tag: data.tag || 'trackify-goal-reminder',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || './goals';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) {
              try {
                client.navigate(new URL(targetUrl, self.location.href).toString());
              } catch (err) {
                // Navigation is only possible for same-origin URLs.
              }
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(new URL(targetUrl, self.location.href).toString());
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Backend API: network-only. Do not cache. Return a clean 503 when offline
  //    so the existing app error handling stays intact.
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            JSON.stringify({
              message: 'You appear to be offline. Check your connection and try again.',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' },
            }
          )
      )
    );
    return;
  }

  // 2. Google Fonts: cache-first.
  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response && (response.status === 200 || response.type === 'opaque')) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // 3. Navigation: network-first, refresh the shell cache, fall back offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(toUrl('./index.html'), copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(toUrl('./index.html'))
            .then((cached) => cached || caches.match(toUrl('./offline.html')))
        )
    );
    return;
  }

  // 4. Same-origin static assets: cache-first with runtime caching.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(toUrl('./offline.html')));
    })
  );
});
