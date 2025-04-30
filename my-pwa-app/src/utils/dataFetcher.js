import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchData, cacheData, loadCachedData } from './sheetsApi';
import { isAuthenticated, getAccessToken } from '../services/authService';
import config from '../config';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes - data considered stale after this time
const fetchers = new Map(); // Global tracking of fetch requests to prevent duplicates

// Cache metadata to track when data was last fetched
const cacheMetadata = new Map();

// Utility function to get timestamp
const getTimestamp = () => new Date().getTime();

// Custom hook for data fetching with SWR-like functionality
export const useSheetData = (range, cacheKey, mapFn = (row) => row, options = {}) => {
  const { 
    initialFetch = true,  // Whether to fetch on initial render
    revalidateOnFocus = true, // Whether to revalidate when window regains focus
    dedupingInterval = 2000, // Prevent multiple requests in this time window
    onSuccess = null, // Callback when data is successfully fetched
    onError = null,   // Callback when an error occurs
  } = options;
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Reference to access the current value of revalidating status
  const isRevalidatingRef = useRef(false);

  // Check if data is stale
  const isDataStale = useCallback(() => {
    if (!cacheMetadata.has(cacheKey)) return true;
    
    const lastFetched = cacheMetadata.get(cacheKey);
    return (getTimestamp() - lastFetched) > STALE_TIME;
  }, [cacheKey]);

  // Function to fetch data with deduping
  const fetchDataWithDeduping = useCallback(async (skipCache = false) => {
    // Skip if another fetch is in progress for this key
    if (fetchers.has(cacheKey) && !skipCache) return;
    
    // Prevent duplicate requests
    const currentTime = getTimestamp();
    const lastRequest = fetchers.get(cacheKey) || 0;
    
    if (currentTime - lastRequest < dedupingInterval && !skipCache) return;
    
    // Mark as fetching
    fetchers.set(cacheKey, currentTime);
    isRevalidatingRef.current = true;
    
    if (isMounted.current) {
      setIsValidating(true);
    }
    
    try {
      // Try to load from cache first if not skipping cache
      if (!skipCache) {
        const cached = await loadCachedData(cacheKey);
        if (cached && isMounted.current) {
          setData(cached);
          // Don't show loading if we have cached data
          if (!isDataStale()) {
            setIsValidating(false);
            isRevalidatingRef.current = false;
            fetchers.delete(cacheKey);
            return;
          }
        }
      }
      
      // Check auth status
      if (!isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      // Perform fetch from API
      try {
        const token = await getAccessToken();
        const fetchedData = await fetchData(range, mapFn);
        
        // Save to cache
        await cacheData(cacheKey, fetchedData);
        cacheMetadata.set(cacheKey, getTimestamp());
        
        if (isMounted.current) {
          setData(fetchedData);
          setError(null);
          if (onSuccess) onSuccess(fetchedData);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
          if (onError) onError(err);
        }
        console.error(`Error fetching data for ${range}:`, err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
      isRevalidatingRef.current = false;
      fetchers.delete(cacheKey);
    }
  }, [cacheKey, range, mapFn, isDataStale, dedupingInterval, onSuccess, onError]);

  // Function to trigger manual revalidation
  const revalidate = useCallback(async (skipCache = false) => {
    if (isRevalidatingRef.current) return;
    
    if (isMounted.current) {
      setIsLoading(true);
    }
    
    await fetchDataWithDeduping(skipCache);
  }, [fetchDataWithDeduping]);

  // Initial data loading
  useEffect(() => {
    if (initialFetch) {
      revalidate();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [initialFetch, revalidate]);

  // Set up focus revalidation
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => {
      if (isDataStale()) {
        revalidate();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [revalidateOnFocus, isDataStale, revalidate]);

  return {
    data,
    isLoading,
    isValidating,
    error,
    revalidate,
    mutate: (newData, shouldRevalidate = true) => {
      setData(newData);
      cacheData(cacheKey, newData);
      if (shouldRevalidate) {
        revalidate(true);
      }
    }
  };
};

// Hook for online status with enhanced behavior
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Optimized version of syncData that prevents over-fetching
export const syncData = async (
  range,
  cacheKey,
  setData,
  mapFn = (row) => row,
  force = false
) => {
  if (typeof setData !== "function") {
    throw new Error("setData must be a function");
  }

  // Check if we have a recent fetch for this data
  const currentTime = getTimestamp();
  const lastFetchTime = cacheMetadata.get(cacheKey) || 0;
  
  // Skip fetch if data is fresh and not forced
  if (!force && currentTime - lastFetchTime < STALE_TIME) {
    const cached = await loadCachedData(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }
  }

  try {
    const data = await fetchData(range, mapFn);
    setData(data);
    await cacheData(cacheKey, data);
    cacheMetadata.set(cacheKey, currentTime);
  } catch (error) {
    const cached = await loadCachedData(cacheKey);
    if (cached) setData(cached);
    console.error(`Sync error for ${range}:`, error);
    throw error; // Re-throw for UI notification
  }
};

// Function to prefetch data and store in cache without updating state
export const prefetchData = async (range, cacheKey, mapFn = (row) => row) => {
  try {
    const data = await fetchData(range, mapFn);
    await cacheData(cacheKey, data);
    cacheMetadata.set(cacheKey, getTimestamp());
    return true;
  } catch (error) {
    console.error(`Prefetch error for ${range}:`, error);
    return false;
  }
};

// Cache clearing function for when data becomes invalid
export const invalidateCache = (cacheKey) => {
  cacheMetadata.delete(cacheKey);
};

// Batch fetch multiple resources at once
export const batchFetchData = async (requests) => {
  const results = {};
  
  await Promise.all(
    requests.map(async ({ range, cacheKey, mapFn = (row) => row }) => {
      try {
        const data = await fetchData(range, mapFn);
        await cacheData(cacheKey, data);
        cacheMetadata.set(cacheKey, getTimestamp());
        results[cacheKey] = { data, error: null };
      } catch (error) {
        const cached = await loadCachedData(cacheKey);
        results[cacheKey] = { data: cached, error };
      }
    })
  );
  
  return results;
};