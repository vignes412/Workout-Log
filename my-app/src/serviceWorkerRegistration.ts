// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

// To learn more about the benefits of this model and instructions on how to
// opt-in, read https://cra.link/PWA

import { Workbox } from 'workbox-window';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onWaiting?: (registration: ServiceWorkerRegistration, wb: Workbox) => void;
  onRefreshNeeded?: () => void;
  onRefreshComplete?: () => void;
};

// Dispatch events related to service worker updates
const dispatchUpdateEvent = (eventType: string, registration?: ServiceWorkerRegistration) => {
  const event = new CustomEvent('serviceWorkerUpdate', {
    detail: {
      type: eventType,
      registration
    }
  });
  window.dispatchEvent(event);
};

// Current service worker instance
let currentSW: ServiceWorkerRegistration | null = null;

export function register(config?: Config): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(
      process.env.PUBLIC_URL || '',
      window.location.href
    );
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });

    // Listen for online events to refresh tokens
    window.addEventListener('online', () => {
      refreshToken(config);
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  // Use workbox-window for better control
  const wb = new Workbox(swUrl);

  // Add update event listeners
  wb.addEventListener('waiting', (event) => {
    // A new service worker is waiting to be activated
    currentSW = event.sw?.scriptURL ? 
      { update: () => wb.messageSkipWaiting() } as any : 
      null;
      
    if (config?.onWaiting && event.sw) {
      config.onWaiting(event.sw as any, wb);
    }
    
    dispatchUpdateEvent('waiting', event.sw as any);
  });

  wb.addEventListener('controlling', () => {
    // Service worker is controlling the page
    if (config?.onRefreshComplete) {
      config.onRefreshComplete();
    }
    
    dispatchUpdateEvent('controlling');
    
    // Reload the page to ensure we get fresh content
    window.location.reload();
  });

  wb.register()
    .then((registration) => {
      // Store registration for later use
      if (registration) {
        currentSW = registration;
        
        // Check for updates immediately on page load
        registration.update();
        
        // Set up periodic update checking
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check for updates every hour
        
        // Setup callbacks
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the updated precached content has been fetched,
                // but the previous service worker will still serve the older
                // content until all client tabs are closed.
                console.log(
                  'New content is available and will be used when all ' +
                    'tabs for this page are closed. See https://cra.link/PWA.'
                );

                // Execute callback
                if (config && config.onUpdate && registration) {
                  config.onUpdate(registration);
                }
                
                dispatchUpdateEvent('update', registration);
              } else {
                // At this point, everything has been precached.
                // It's the perfect time to display a
                // "Content is cached for offline use." message.
                console.log('Content is cached for offline use.');

                // Execute callback
                if (config && config.onSuccess && registration) {
                  config.onSuccess(registration);
                }
                
                dispatchUpdateEvent('success', registration);
              }
            }
          };
        };
      }
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function update(): void {
  if (currentSW && currentSW.update) {
    currentSW.update();
  }
}

export function skipWaiting(): void {
  if (currentSW && (currentSW as any).waiting) {
    (currentSW as any).waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Token refresh functionality
async function refreshToken(config?: Config) {
  // Only attempt token refresh when coming back online
  if (!navigator.onLine) {
    return;
  }
  
  try {
    // Attempt to refresh token from authentication service
    if (config?.onRefreshNeeded) {
      config.onRefreshNeeded();
    }
    
    // Try to get the current auth token
    if (typeof (window as any).refreshAccessToken === 'function') {
      await (window as any).refreshAccessToken();
    }
    
    // After refresh, tell the app refresh is complete
    if (config?.onRefreshComplete) {
      config.onRefreshComplete();
    }
    
    // Dispatch event for successful token refresh
    dispatchUpdateEvent('tokenRefresh');
  } catch (error) {
    console.error('Failed to refresh token:', error);
    
    // Dispatch error event
    const event = new CustomEvent('serviceWorkerUpdate', {
      detail: {
        type: 'tokenRefreshError',
        error
      }
    });
    window.dispatchEvent(event);
  }
}

// No need to redefine Window interface here - using the one from authService.ts