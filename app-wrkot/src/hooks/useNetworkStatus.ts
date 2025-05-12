import { useState, useEffect } from 'react';
import { processSyncQueue, registerNetworkListeners } from '../lib/pwa-utils';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirstConnect, setIsFirstConnect] = useState(false);

  useEffect(() => {
    // Handle online status change
    const handleOnline = () => {
      setIsOnline(true);
      // If this is a reconnection (not the initial page load), process any queued requests
      if (!isFirstConnect) {
        processSyncQueue().catch(console.error);
      } else {
        setIsFirstConnect(false);
      }
    };

    // Handle offline status change
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial online status
    setIsOnline(navigator.onLine);
    setIsFirstConnect(true);

    // Register for network status events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register general network listeners for background sync
    registerNetworkListeners();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

export default useNetworkStatus;
