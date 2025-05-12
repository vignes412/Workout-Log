import { useCallback } from 'react';
import { queueAPIRequest } from '../lib/pwa-utils';
import useNetworkStatus from './useNetworkStatus';

// API Hook with offline support
export function useAPI() {
  const { isOnline } = useNetworkStatus();
  
  const fetchWithOfflineSupport = useCallback(async (
    url: string,
    options: {
      method?: string,
      headers?: Record<string, string>,
      body?: any,
      offlineFallback?: boolean,
      offlineData?: any
    } = {}
  ) => {
    const {
      method = 'GET',
      headers = {},
      body,
      offlineFallback = true,
      offlineData = null
    } = options;
    
    // If online, attempt a normal fetch
    if (isOnline) {
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: method !== 'GET' && body ? JSON.stringify(body) : undefined
        });
        
        if (response.ok) {
          return {
            ok: true,
            data: await response.json(),
            offline: false
          };
        } else {
          return {
            ok: false,
            error: `Server responded with ${response.status}: ${response.statusText}`,
            offline: false
          };
        }
      } catch (error) {
        // If fetch fails (possibly due to unstable network)
        if (offlineFallback && offlineData) {
          return {
            ok: true,
            data: offlineData,
            offline: true,
            error
          };
        }
        
        return {
          ok: false,
          error: `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
          offline: false
        };
      }
    } 
    
    // If offline and write operation, queue for later
    if (!isOnline && method !== 'GET') {
      try {
        const queueId = await queueAPIRequest(url, method, body, headers);
        return {
          ok: true,
          queueId,
          offline: true,
          queued: true,
          data: body // Return the data that will be sent when online
        };
      } catch (error) {
        return {
          ok: false,
          error: `Failed to queue request: ${error instanceof Error ? error.message : String(error)}`,
          offline: true
        };
      }
    }
    
    // If offline and read operation, return fallback data if provided
    if (!isOnline && method === 'GET') {
      if (offlineFallback && offlineData !== null) {
        return {
          ok: true,
          data: offlineData,
          offline: true
        };
      }
      
      return {
        ok: false,
        error: 'You are currently offline and no cached data is available',
        offline: true
      };
    }
  }, [isOnline]);
  
  return {
    fetch: fetchWithOfflineSupport,
    isOnline
  };
}

export default useAPI;
