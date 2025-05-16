import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';
import posthog from 'posthog-js';
import './index.css';
// @ts-expect-error - virtual module provided by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';
import { serviceWorkerOptions, pwaConfig } from './config/pwa.config';
import { handleServiceWorkerDev } from './lib/pwa-utils';
import { Toaster } from 'sonner';

// Import framer-motion for animations (not used here directly)
// import { AnimatePresence } from 'framer-motion';

// Import App component
import { App } from './App';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ThemeCustomizationProvider } from './contexts/ThemeCustomizationContext';

// Declare updateSW on window for TypeScript
declare global {
  interface Window {
    updateSW: (reloadPage?: boolean) => Promise<void>;
  }
}

// Handle development mode service worker issues before registration
if (import.meta.env.DEV) {
  handleServiceWorkerDev().catch(console.error);
}

// Register service worker for PWA functionality
const updateSW = registerSW({
  ...serviceWorkerOptions,
  onRegisteredSW(swUrl, r) {
    console.log(`Service Worker registered: ${swUrl}`);
    // Initialize periodic service worker updates check
    if (r) { // Check if registration was successful
      setInterval(() => {
        r.update();
      }, pwaConfig.updates.checkInterval || 60 * 60 * 1000); // Default 1 hour
    }
  },
});

// Make the updateSW function available globally for use in components
window.updateSW = updateSW;

// Initialize monitoring tools in production only
if (import.meta.env.PROD) {
  // Sentry for error tracking
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [browserTracingIntegration(), replayIntegration()],
      // Performance monitoring
      tracesSampleRate: 0.2,
      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  // PostHog for analytics
  if (import.meta.env.VITE_POSTHOG_API_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
      // Disable capturing by default, this will be controlled by user consent
      capture_pageview: false,
      // In a real app, you'd want to handle user consent
      autocapture: false,
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ThemeCustomizationProvider>
        <Toaster position="top-center" richColors />
        <App />
      </ThemeCustomizationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
