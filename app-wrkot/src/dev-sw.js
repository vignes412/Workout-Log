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
  // Just pass through all fetch events in dev mode
  return;
});
