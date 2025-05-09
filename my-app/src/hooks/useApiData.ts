import { useState, useEffect, useCallback } from 'react';
import DataService from '../services/DataService';
import { ApiResult } from '../types/sheetsApi';

interface UseApiDataOptions {
  initialFetch?: boolean;
  fetchOnMount?: boolean;
  skipCache?: boolean;
  ttl?: number; // time-to-live in milliseconds
  debounceFetchMs?: number;
  transformData?: (data: any) => any; // Added transformData option
}

interface UseApiDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchData: (force?: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
  fromCache: boolean;
}

/**
 * Custom hook for efficient data fetching with caching
 * 
 * @param resourceType The type of resource being fetched (used for caching)
 * @param params Any parameters needed for the fetch
 * @param fetcher Function that returns a promise with the data
 * @param options Configuration options for the data fetch
 * @returns Object with data, loading state, and methods to refresh
 */
export function useApiData<T>(
  resourceType: string,
  params: object = {},
  fetcher: () => Promise<ApiResult>,
  options: UseApiDataOptions = {}
): UseApiDataReturn<T> {
  const {
    initialFetch = true,
    fetchOnMount = true,
    skipCache = false,
    ttl,
    debounceFetchMs = 200,
    transformData // Get the transform function from options
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialFetch);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [fetchCount, setFetchCount] = useState<number>(0);
  const [fetchDebouncer, setFetchDebouncer] = useState<NodeJS.Timeout | null>(null);

  // Create a memoized fetch function to use across effect dependencies
  const fetchDataCore = useCallback(async (force: boolean = false): Promise<void> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await DataService.getData<T>(
        resourceType,
        params,
        fetcher,
        {
          bypassCache: force || skipCache,
          ttl
        }
      );

      if (result.success) {
        // Apply transform function if provided
        const processedData = transformData && typeof transformData === 'function' 
          ? transformData(result.data)
          : result.data;
          
        setData(processedData as T);
        setFromCache(!!result.fromCache);
      } else {
        throw result.error || new Error('Failed to fetch data');
      }
    } catch (err) {
      console.error(`Error fetching ${resourceType}:`, err);
      setIsError(true);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [resourceType, params, fetcher, skipCache, ttl, transformData]);

  // Debounced fetch function to prevent multiple rapid calls
  const fetchData = useCallback((force: boolean = false): Promise<void> => {
    if (fetchDebouncer) {
      clearTimeout(fetchDebouncer);
    }

    // Increment fetch count to trigger data refresh
    setFetchCount(prev => prev + 1);

    // Schedule debounced fetch
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        fetchDataCore(force)
          .then(resolve)
          .catch(reject);
      }, debounceFetchMs);

      setFetchDebouncer(timer);
    });
  }, [fetchDebouncer, fetchDataCore, debounceFetchMs]);

  // Alias for forcing a refresh
  const refreshData = useCallback((): Promise<void> => {
    return fetchData(true);
  }, [fetchData]);

  // Fetch on mount if configured
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }

    return () => {
      // Clear timeout on unmount
      if (fetchDebouncer) {
        clearTimeout(fetchDebouncer);
      }
    };
  }, [fetchOnMount, fetchData, fetchDebouncer]);

  // Handle param changes
  useEffect(() => {
    if (fetchCount > 0) { // Only react to param changes after initial fetch
      fetchData();
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    isLoading,
    isError,
    error,
    fetchData,
    refreshData,
    fromCache
  };
}