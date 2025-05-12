import React, { useEffect, useState } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { UpdateNotification } from './UpdateNotification';

interface PWAEventType {
  prompt: boolean;
  installed: boolean;
  update: boolean;
  error: boolean;
}

export function PWAHandler() {
  const [events, setEvents] = useState<PWAEventType>({
    prompt: false,
    installed: false,
    update: false,
    error: false
  });
    useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as unknown as {standalone?: boolean}).standalone === true;
                         
    if (isStandalone) {
      setEvents(prev => ({ ...prev, installed: true }));
    }
    
    // Listen for installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setEvents(prev => ({ ...prev, prompt: true }));
    };
    
    // Listen for installation success
    const handleAppInstalled = () => {
      setEvents(prev => ({ ...prev, installed: true, prompt: false }));
      console.log('PWA was installed successfully');
    };
    
    // Listen for update available
    const handleUpdateAvailable = () => {
      setEvents(prev => ({ ...prev, update: true }));
    };
      // Listen for offline/online events to show appropriate UI
    const handleOffline = () => {
      console.log('App is offline');
    };
    
    const handleOnline = () => {
      console.log('App is online');
    };
    
    // Listen for service worker registration errors
    const handleRegistrationError = (e: CustomEvent) => {
      const { error } = e.detail;
      console.error('Service worker registration failed:', error);
      setEvents(prev => ({ ...prev, error: true }));
      
      // In development, we can be more lenient with SW errors
      if (import.meta.env.DEV) {
        console.warn('Service worker errors are expected in development mode with hot reloading');
      }
    };
      // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-update-available', handleUpdateAvailable as EventListener);
    window.addEventListener('pwa-registration-error', handleRegistrationError as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable as EventListener);
      window.removeEventListener('pwa-registration-error', handleRegistrationError as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <>
      {events.prompt && <PWAInstallPrompt />}
      {events.update && <UpdateNotification />}
    </>
  );
}
