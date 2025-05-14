import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../utils/sheetsApi';

/**
 * Custom hook for managing online status and pending syncs
 * @returns Object with online status and pending operations count
 */
export const useNetworkStatus = () => {
  const isOnline = useOnlineStatus();
  const [pendingOperations, setPendingOperations] = useState<number>(0);
  
  useEffect(() => {
    // Listen for messages from service worker about pending operations
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PENDING_OPERATIONS_COUNT') {
        setPendingOperations(event.data.count);
      }
    };
    
    // Listen for background sync completed events
    const handleBackgroundSyncCompleted = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC_COMPLETED') {
        // Decrease pending operations count when sync completes
        setPendingOperations(prev => Math.max(0, prev - 1));
      }
    };
    
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    navigator.serviceWorker?.addEventListener('message', handleBackgroundSyncCompleted);
    
    // Request current pending operations count from service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_PENDING_OPERATIONS_COUNT'
      });
    }
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      navigator.serviceWorker?.removeEventListener('message', handleBackgroundSyncCompleted);
    };
  }, []);
  
  return {
    isOnline,
    pendingOperations,
    hasPendingOperations: pendingOperations > 0
  };
};

export default useNetworkStatus;