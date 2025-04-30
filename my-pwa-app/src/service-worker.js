/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === "https://sheets.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "api-cache",
  })
);

registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "image-cache",
  })
);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Add handler for CACHE_IMAGES messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_IMAGES") {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      event.waitUntil(
        caches.open("image-cache").then((cache) => {
          return Promise.all(
            urls.map((url) => {
              if (url) {
                return fetch(url)
                  .then((response) => {
                    if (response.ok) return cache.put(url, response);
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
