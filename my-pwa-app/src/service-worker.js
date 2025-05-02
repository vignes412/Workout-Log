/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst 
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// Precache all assets listed in the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Sheets API requests with StaleWhileRevalidate strategy
registerRoute(
  ({ url }) => url.origin === "https://sheets.googleapis.com",
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50, // Maximum 50 entries
        maxAgeSeconds: 30 * 60, // 30 minutes
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache images with CacheFirst strategy for better performance
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100, // Maximum 100 images
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache other static assets with StaleWhileRevalidate
registerRoute(
  ({ request }) => 
    request.destination === "script" || 
    request.destination === "style" ||
    request.destination === "font",
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Skip waiting during installation
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Claim clients immediately upon activation
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle CACHE_IMAGES messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_IMAGES") {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      event.waitUntil(
        caches.open("image-cache").then((cache) => {
          return Promise.all(
            urls.map((url) => {
              if (url) {
                return fetch(url, { mode: 'no-cors' })
                  .then((response) => {
                    if (response.ok || response.type === 'opaque') {
                      return cache.put(url, response);
                    }
                    return Promise.resolve();
                  })
                  .catch(() => Promise.resolve()); // Ignore errors
              }
              return Promise.resolve();
            })
          );
        })
      );
    }
  }
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'syncPendingData') {
    event.waitUntil(syncPendingData());
  }
});

// Function to sync any pending data
async function syncPendingData() {
  try {
    const cache = await caches.open('offline-mutations');
    const requests = await cache.keys();
    
    // Process each pending request
    return Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const mutationData = await response.json();
        
        try {
          // Attempt to send the request to the server
          const { url, method, headers, body } = mutationData;
          const serverResponse = await fetch(url, {
            method: method || 'POST',
            headers: headers || { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          
          if (serverResponse.ok) {
            // If successful, remove from the offline mutations cache
            await cache.delete(request);
            return { success: true, url };
          }
          return { success: false, url, error: 'Server responded with an error' };
        } catch (error) {
          return { success: false, url: request.url, error: error.message };
        }
      })
    );
  } catch (error) {
    console.error('Error syncing pending data:', error);
    return [];
  }
}

// Handle requests when offline
self.addEventListener('fetch', (event) => {
  // Only intercept API requests relevant to our app
  if (event.request.url.includes('sheets.googleapis.com')) {
    event.respondWith(
      fetch(event.request.clone())
        .catch(async (error) => {
          // If the fetch fails (offline), return cached data if available
          const cache = await caches.open('api-cache');
          const cachedResponse = await cache.match(event.request);
          
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If no cached data, return a custom offline response
          return new Response(
            JSON.stringify({ 
              error: 'You are offline. This data will be updated when you reconnect.',
              offline: true 
            }),
            { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
  }
});
