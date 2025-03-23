/* eslint-disable no-restricted-globals */
// public/service-worker.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import config from "../src/config"; // Note: This won't work directly in service worker

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache Google Sheets API calls
registerRoute(
  ({ url }) => url.origin === "https://sheets.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: config.cache.API_CACHE_NAME, // This won't work, see note below
  })
);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
