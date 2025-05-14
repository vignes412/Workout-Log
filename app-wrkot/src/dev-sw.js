// This is a minimal service worker for development mode
// It will be replaced with the full service worker in production

// Basic self listeners for development testing
self.addEventListener('install', (event) => {
  console.log('Development Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Development Service Worker activated');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // More advanced caching for development, closer to production
  const API_CACHE_NAME = 'sheets-api-cache'; // Changed to sheets-api-cache
  const STATIC_CACHE_NAME = 'static-assets-cache';
  const SPREADSHEET_API_URL_PATTERN = /script\.google\.com\/macros\/s\/.+\/exec/;

  // Message listener for clearing caches
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_API_CACHE') {
      if (event.data.cacheName) {
        console.log(`[SW] Clearing cache: ${event.data.cacheName}`);
        caches.delete(event.data.cacheName).then(() => {
          console.log(`[SW] Cache ${event.data.cacheName} cleared.`);
          // Optionally, send a message back to the client
          // event.ports[0].postMessage({ status: 'Cache cleared' });
        });
      } else {
        console.warn('[SW] CLEAR_API_CACHE message received without cacheName.');
      }
    }
  });

  // Stale-while-revalidate for API calls (e.g., Google Sheets)
  if (SPREADSHEET_API_URL_PATTERN.test(event.request.url)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache first for static assets (example, adjust as needed)
  // This is usually handled by Workbox precaching in production
  // For dev, you might want to be more explicit or rely on browser cache
  // if (event.request.destination === 'script' || event.request.destination === 'style') {
  //   event.respondWith(
  //     caches.open(STATIC_CACHE_NAME).then(async (cache) => {
  //       const cachedResponse = await cache.match(event.request);
  //       return cachedResponse || fetch(event.request).then(networkResponse => {
  //         cache.put(event.request, networkResponse.clone());
  //         return networkResponse;
  //       });
  //     })
  //   );
  //   return;
  // }

  // Default: go to network
  // console.log('[SW] Fetching (network): ', event.request.url);
  return; // Keep this to fall back to network for unhandled requests
});
