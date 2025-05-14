// This file contains configuration for the PWA service worker

interface PwaConfiguration {
  registerPath: string;
  scope: string;
  caching: {
    strategies: {
      api: 'network-first' | 'cache-first' | 'stale-while-revalidate';
      assets: 'network-first' | 'cache-first' | 'stale-while-revalidate';
      exercises: 'network-first' | 'cache-first' | 'stale-while-revalidate';
      documents: 'network-first' | 'cache-first' | 'stale-while-revalidate';
    };
    expiration: {
      api: number; // in seconds
      assets: number; // in seconds
      exercises: number; // in seconds
      documents: number; // in seconds
    };
  };
  notifications: {
    enabled: boolean;
    defaultIcon: string;
    defaultBadge: string;
  };
  backgroundSync: {
    enabled: boolean;
    workoutLogsQueueName: string;
    measurementsQueueName: string;
    maxRetentionTime: number; // in seconds
  };
  installation: {
    promptEvents: string[];
    installButtonText: string;
    installDescription: string;
  };
  updates: {
    checkInterval: number; // in milliseconds
    promptForReload: boolean;
  };
}

// Default PWA configuration
export const pwaConfig: PwaConfiguration = {
  registerPath: '/service-worker.js',
  scope: '/',
  caching: {
    strategies: {
      api: 'network-first',
      assets: 'cache-first',
      exercises: 'stale-while-revalidate',
      documents: 'cache-first'
    },
    expiration: {
      api: 60 * 5, // 5 minutes
      assets: 60 * 60 * 24 * 7, // 7 days
      exercises: 60 * 60 * 24 * 3, // 3 days
      documents: 60 * 60 * 24 * 7 // 7 days
    }
  },
  notifications: {
    enabled: true,
    defaultIcon: '/icons/icon-192x192.png',
    defaultBadge: '/icons/workout-icon.svg'
  },
  backgroundSync: {
    enabled: true,
    workoutLogsQueueName: 'workout-logs-queue',
    measurementsQueueName: 'measurements-queue',
    maxRetentionTime: 60 * 60 * 24 * 7 // 7 days
  },
  installation: {
    promptEvents: ['installed', 'beforeinstallprompt'],
    installButtonText: 'Install App',
    installDescription: 'Install this app on your device for offline access'
  },
  updates: {
    checkInterval: 60 * 60 * 1000, // 1 hour
    promptForReload: true
  }
};

// Service worker registration options
export const serviceWorkerOptions = {
  immediate: true,
  onNeedRefresh: () => {
    const event = new CustomEvent('pwa-update-available', {
      detail: {
        updateSW: () => true,
        reloadPage: () => window.location.reload()
      }
    });
    window.dispatchEvent(event);
  },
  onOfflineReady: () => {
    const event = new CustomEvent('pwa-offline-ready');
    window.dispatchEvent(event);
  },
  onRegistered: (registration: ServiceWorkerRegistration) => {
    // Setup push notifications if enabled
    if (pwaConfig.notifications.enabled && 'pushManager' in registration) {
      console.log('Push notifications supported');
    }
  },
  onRegisterError: (error: Error) => {
    console.error('Service worker registration error:', error);
    
    // Don't show error in dev mode for 500 responses (dev-sw.js may not be ready yet)
    if (import.meta.env.DEV && error.message.includes('500')) {
      console.warn('Service worker registration failed with 500 error in dev mode. This is normal during hot reloading.');
      return;
    }
    
    // Show an error notification in production only
    if (import.meta.env.PROD) {
      const event = new CustomEvent('pwa-registration-error', {
        detail: { error }
      });
      window.dispatchEvent(event);
    }
  }
};
