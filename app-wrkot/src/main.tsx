import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';
import posthog from 'posthog-js';
import './index.css';

// Import App component
import { App } from './App';

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
    <App />
  </React.StrictMode>
);
