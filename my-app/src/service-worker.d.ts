/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

// This allows TypeScript to detect our service worker type
export type {};

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<{
      revision: string;
      url: string;
    }>;
  }
}