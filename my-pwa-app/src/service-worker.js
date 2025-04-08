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
