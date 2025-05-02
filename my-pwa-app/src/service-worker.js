/* eslint-disable no-restricted-globals */
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, setCatchHandler, setDefaultHandler } from "workbox-routing";
import { 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst,
  NetworkOnly
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// Enable debugging in development
const DEBUG = process.env.NODE_ENV === 'development';

// Initialize background sync queue
const bgSyncPlugin = new BackgroundSyncPlugin('workout-sync-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (specified in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('Background sync successful for:', entry.request.url);
      } catch (error) {
        console.error('Background sync failed for:', entry.request.url, error);
        // Put the entry back in the queue and re-throw the error
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// Clean up any outdated precaches
cleanupOutdatedCaches();

// Precache all assets listed in the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Sheets API requests with NetworkFirst strategy
registerRoute(
  ({ url }) => url.origin === "https://sheets.googleapis.com",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10, // Timeout if network request takes more than 10 seconds
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50, 
        maxAgeSeconds: 30 * 60, // 30 minutes
        purgeOnQuotaError: true,
      }),
      bgSyncPlugin, // Add background sync for failed requests
    ],
  })
);

// Cache workout images with CacheFirst strategy
registerRoute(
  ({ request, url }) => 
    request.destination === "image" || 
    url.pathname.endsWith('.gif') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg'),
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200, // Increased to 200 to cache more workout images
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days - workout images rarely change
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache static assets with StaleWhileRevalidate
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
        maxEntries: 60,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Cache HTML responses for navigation requests
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache Google Fonts with StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Fallback for networkOnly strategy
// For requests that you intentionally don't want to cache
setDefaultHandler(new NetworkOnly());

// Provide a fallback response for navigation and API requests when offline
setCatchHandler(async ({ request, event }) => {
  const destination = request.destination;
  const cache = await caches.open('fallback-cache');

  // If we're offline and it's a navigation request (HTML), return the offline page
  if (request.mode === 'navigate') {
    const fallbackResponse = await cache.match('/offline.html');
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // If offline.html isn't available, provide a simple response
    return new Response(
      `<html>
        <head>
          <title>Offline - Workout Log</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>You are offline</h1>
          <p>Please check your internet connection and try again.</p>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // If it's an API request, return a JSON response
  if (request.url.includes('sheets.googleapis.com') || request.url.includes('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'You are offline. This data will be updated when you reconnect.',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // For images, return a placeholder
  if (destination === 'image') {
    const fallbackImage = await cache.match('/assets/offline-image-placeholder.png');
    if (fallbackImage) {
      return fallbackImage;
    }
    // Return a simple SVG placeholder if no fallback image exists
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" font-family="sans-serif" font-size="24" text-anchor="middle" fill="#6c757d">Offline</text>
      </svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      }
    );
  }

  // For other asset types, return a basic offline response
  return new Response('Offline. Resource not available.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain',
    },
  });
});

// Skip waiting during installation
self.addEventListener("install", (event) => {
  if (DEBUG) {
    console.log('Service Worker: Installed');
  }
  self.skipWaiting();
});

// Claim clients immediately upon activation
self.addEventListener("activate", (event) => {
  if (DEBUG) {
    console.log('Service Worker: Activated');
  }
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
                  .catch((error) => {
                    if (DEBUG) {
                      console.error(`Failed to cache image: ${url}`, error);
                    }
                    return Promise.resolve(); // Ignore errors
                  });
              }
              return Promise.resolve();
            })
          );
        })
      );
    }
  } else if (event.data && event.data.type === "CLEAR_CACHES") {
    // Add ability to clear caches on demand
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (DEBUG) {
              console.log(`Clearing cache: ${cacheName}`);
            }
            return caches.delete(cacheName);
          })
        );
      })
    );
  } else if (event.data && event.data.type === "SKIP_WAITING") {
    // Allow the app to trigger skipWaiting for a more controlled update process
    self.skipWaiting();
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
    
    if (DEBUG) {
      console.log(`Found ${requests.length} pending mutations to sync`);
    }
    
    if (requests.length === 0) {
      return [];
    }
    
    // Process each pending request
    return Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const mutationData = await response.json();
        
        try {
          // Attempt to send the request to the server
          const { url, method, headers, body } = mutationData;
          
          if (DEBUG) {
            console.log(`Syncing mutation: ${method} ${url}`);
          }
          
          const serverResponse = await fetch(url, {
            method: method || 'POST',
            headers: headers || { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include', // Include credentials for authenticated requests
          });
          
          if (serverResponse.ok) {
            // If successful, remove from the offline mutations cache
            await cache.delete(request);
            
            // Also update the API cache with the latest data
            try {
              const apiCache = await caches.open('api-cache');
              const getUrl = url.split(':').slice(0, -1).join(':'); // Remove the append/update part
              const cachedGetRequests = await apiCache.keys();
              const matchingRequests = cachedGetRequests.filter(req => req.url.includes(getUrl));
              
              // Invalidate any related cached GET requests to ensure fresh data
              for (const req of matchingRequests) {
                await apiCache.delete(req);
              }
            } catch (e) {
              console.warn('Failed to invalidate API cache:', e);
            }
            
            return { success: true, url };
          }
          
          // If the server responded but with an error, log it
          const errorText = await serverResponse.text();
          console.error(`Server error: ${serverResponse.status}`, errorText);
          
          return { 
            success: false, 
            url, 
            error: `Server responded with status ${serverResponse.status}` 
          };
        } catch (error) {
          if (DEBUG) {
            console.error(`Sync failed for: ${request.url}`, error);
          }
          return { success: false, url: request.url, error: error.message };
        }
      })
    );
  } catch (error) {
    console.error('Error syncing pending data:', error);
    return [];
  }
}

// Improved fetch handler for offline experience
self.addEventListener('fetch', (event) => {
  // Only handle API requests or specific patterns we want custom behavior for
  if (event.request.url.includes('sheets.googleapis.com') || 
      event.request.url.includes('/api/')) {
        
    // For API requests, we'll use a more sophisticated strategy
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(event.request.clone());
          
          // If successful, cache the response
          if (networkResponse.ok) {
            const apiCache = await caches.open('api-cache');
            await apiCache.put(event.request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          const cache = await caches.open('api-cache');
          const cachedResponse = await cache.match(event.request);
          
          if (cachedResponse) {
            // Add an offline indicator header to the cached response
            const headers = new Headers(cachedResponse.headers);
            headers.append('X-Is-Offline', 'true');
            
            // Return a modified response with the offline header
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: headers
            });
          }
          
          // If it's a mutation (POST, PUT, DELETE), store for later
          if (isWriteRequest(event.request)) {
            try {
              const offlineMutationCache = await caches.open('offline-mutations');
              const requestId = `mutation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              
              // Create a persistent record of this request
              const requestData = {
                url: event.request.url,
                method: event.request.method,
                headers: Object.fromEntries(event.request.headers.entries()),
                body: await event.request.clone().json(),
                timestamp: Date.now()
              };
              
              await offlineMutationCache.put(
                new Request(`/pending-mutations/${requestId}`),
                new Response(JSON.stringify(requestData))
              );
              
              // Schedule a background sync
              if ('sync' in registration) {
                await registration.sync.register('syncPendingData');
              }
              
              // Return a "deferred" success response
              return new Response(
                JSON.stringify({
                  success: true,
                  offline: true,
                  message: 'Your changes will be saved when you reconnect.',
                  timestamp: new Date().toISOString(),
                  requestId
                }),
                {
                  status: 202, // Accepted
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            } catch (offlineError) {
              console.error('Failed to queue offline mutation:', offlineError);
            }
          }
          
          // No cached response and couldn't queue for later
          return new Response(
            JSON.stringify({
              error: 'You are offline and this data is not available.',
              offline: true,
              timestamp: new Date().toISOString()
            }),
            {
              status: 503, // Service Unavailable
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      })()
    );
  }
});

// Helper to determine if a request is a write operation
function isWriteRequest(request) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
}

// Send a message to the client when the service worker is updated
self.addEventListener('message', event => {
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: '1.1.0' // Increment this when you make significant changes
    });
  }
});
