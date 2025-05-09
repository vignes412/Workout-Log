// src/utils/dataFetcher.ts
import config from '../config';
import * as sheetsApi from './sheetsApi';
import DataService from '../services/DataService';

interface BatchFetchRequest {
  range: string;
  cacheKey: string;
  mapFn?: (row: any) => any;
}

interface BatchFetchResult {
  [key: string]: {
    data: any;
    error: Error | null;
  };
}

const { SPREADSHEET_ID } = config.google;
const { DATA_CACHE_NAME } = config.cache;

/**
 * Batch fetch multiple data ranges in parallel
 * @param requests Array of fetch requests with range, cache key and optional mapping function
 * @returns Object with results keyed by cache keys
 */
export const batchFetchData = async (
  requests: BatchFetchRequest[]
): Promise<BatchFetchResult> => {
  // Use the DataService for efficient batch fetching with caching
  return DataService.batchFetchData(requests);
};

/**
 * Prefetch data in the background without blocking the UI
 * @param range Sheet range to prefetch
 * @param cacheKey Cache key to store the data under
 * @param mapFn Optional mapping function to transform data
 */
export const prefetchData = async (
  range: string,
  cacheKey: string,
  mapFn?: (row: any) => any
): Promise<void> => {
  // Use DataService for smart prefetching
  DataService.prefetchData(
    cacheKey,
    { range },
    () => window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    }).then(response => {
      let data = response.result.values || [];
      
      // Apply mapping function if provided
      if (mapFn && typeof mapFn === 'function') {
        data = data.map(mapFn);
      }
      
      return { success: true, data };
    }).catch(error => {
      console.debug('Prefetch operation failed silently:', error);
      return { success: false, data: null, error };
    })
  );
};

/**
 * Check if data exists in cache
 * @param cacheKey Cache key to check
 * @returns Promise resolving to boolean indicating if data exists
 */
export const isDataCached = async (cacheKey: string): Promise<boolean> => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = await cache.match(cacheKey);
    return !!response;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};

/**
 * Pre-cache essential data for offline access
 * @returns Promise resolving when precaching is complete
 */
export const preCacheEssentialData = async (): Promise<void> => {
  console.log('Precaching essential data for offline access');
  
  try {
    // Cache exercise data
    await DataService.getExercises();
    
    // Cache workout templates
    await DataService.getWorkoutTemplates();
    
    // Cache today's workout if exists
    await DataService.getTodaysWorkout();
    
    // Cache recent workout logs (last 30 days only)
    const result = await DataService.getWorkoutLogs();
    
    if (result.success && result.data) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter logs to recent ones only
      const recentLogs = result.data.filter((log: any) => {
        const logDate = new Date(log[0]);
        return logDate >= thirtyDaysAgo;
      });
      
      // Store the filtered logs in cache
      if (recentLogs.length > 0) {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put('/api/recent-workout-logs', new Response(JSON.stringify(recentLogs)));
      }
    }
    
    console.log('Essential data precaching complete');
  } catch (error) {
    console.error('Error precaching essential data:', error);
  }
};