// Service worker tuned for an SPA that ships frequently.
//
// Strategy:
//   - HTML (navigations) → network-first, fall back to cached shell.
//     Prevents the classic "stale HTML references missing JS chunks"
//     blank-page-after-deploy problem.
//   - Hashed assets (/assets/*) → cache-first. They're immutable once shipped.
//   - API calls → never cached.
//
// Bumping CACHE_VERSION invalidates everything on the next activate.
const CACHE_VERSION = 'v3';
const RUNTIME_CACHE = `rhythm-runtime-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Activate as soon as the new SW is installed.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== RUNTIME_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses.
  if (url.pathname.startsWith('/api/')) return;

  // HTML navigations: network-first.
  const isHTML =
    req.mode === 'navigate' ||
    req.headers.get('accept')?.includes('text/html');
  if (isHTML) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Hashed bundles + static assets: cache-first.
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    return cached || cache.match('/');
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') cache.put(req, res.clone());
  return res;
}
