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

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_IMAGES") {
    const imageUrls = event.data.urls;
    event.waitUntil(
      caches.open("image-cache").then((cache) => {
        return Promise.all(
          imageUrls.map((url) =>
            cache.match(url).then((response) => {
              if (!response) {
                return fetch(url).then((networkResponse) => {
                  return cache.put(url, networkResponse.clone());
                });
              }
            })
          )
        );
      })
    );
  }
});
