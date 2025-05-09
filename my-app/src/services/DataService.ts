import * as sheetsApi from '../utils/sheetsApi';
import { ApiResult } from '../types/sheetsApi';
import config from '../config';

// Time-to-live for cached data in milliseconds
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DataService {
  private static instance: DataService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private prefetchQueue: string[] = [];
  private isPrefetching = false;
  
  // Make constructor private so it can only be instantiated once
  private constructor() {
    // Initialize service
    this.initializeBackgroundSyncListeners();
  }
  
  /**
   * Get singleton instance of DataService
   */
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }
  
  /**
   * Initialize listeners for background sync completion
   */
  private initializeBackgroundSyncListeners(): void {
    // Listen for background sync completion events from service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'BACKGROUND_SYNC_COMPLETED') {
          // Clear cache for the affected URL to ensure fresh data on next fetch
          const url = event.data.url;
          this.clearCacheForUrl(url);
        }
      });
    }
  }
  
  /**
   * Clear cache for a specific URL pattern
   */
  private clearCacheForUrl(url: string): void {
    // Find cache keys that match the URL pattern
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    });
    
    // Delete matching cache entries
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
    
    // Log cache invalidation
    if (keysToDelete.length > 0) {
      console.log(`Invalidated ${keysToDelete.length} cache entries for ${url}`);
    }
  }
  
  /**
   * Generate cache key
   */
  private getCacheKey(resourceType: string, params: any): string {
    return `${resourceType}:${JSON.stringify(params)}`;
  }
  
  /**
   * Initialize Google API client with access token
   */
  public async initialize(accessToken: string): Promise<void> {
    return sheetsApi.initClient(accessToken);
  }
  
  /**
   * Get data with caching
   */
  public async getData<T>(
    resourceType: string,
    params: any,
    fetcher: () => Promise<ApiResult>,
    options: {
      ttl?: number;
      bypassCache?: boolean;
      cacheKey?: string;
    } = {}
  ): Promise<ApiResult> {
    const {
      ttl = DEFAULT_CACHE_TTL,
      bypassCache = false,
      cacheKey: providedCacheKey
    } = options;
    
    // Allow custom cache key or generate one
    const cacheKey = providedCacheKey || this.getCacheKey(resourceType, params);
    
    // Check for pending request for same resource to avoid duplicate API calls
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Returning pending request for: ${cacheKey}`);
      return this.pendingRequests.get(cacheKey) as Promise<ApiResult>;
    }
    
    // Check cache if not bypassing
    if (!bypassCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log(`Cache hit for: ${cacheKey}`);
        return { success: true, data: cached.data, fromCache: true };
      }
    }
    
    // Create the fetch promise
    const fetchPromise = fetcher().then(result => {
      // Only cache successful responses
      if (result.success && result.data) {
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl
        });
      }
      
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      // Handle error, remove from pending
      this.pendingRequests.delete(cacheKey);
      console.error(`Error fetching ${resourceType}:`, error);
      
      // Check if we have stale cache data we can return
      const staleData = this.cache.get(cacheKey);
      if (staleData) {
        console.log(`Returning stale data for: ${cacheKey}`);
        return { 
          success: true, 
          data: staleData.data, 
          fromCache: true,
          stale: true
        };
      }
      
      return { success: false, data: null, error };
    });
    
    // Add to pending requests
    this.pendingRequests.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }
  
  /**
   * Get workout templates
   */
  public async getWorkoutTemplates(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'workoutTemplates',
      {},
      () => sheetsApi.fetchWorkoutTemplates(),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Get exercises
   */
  public async getExercises(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'exercises',
      {},
      () => sheetsApi.fetchData(
        "Exercises!A2:D",
        "/api/exercises",
        (row: any[]) => ({
          muscleGroup: row[0],
          exercise: row[1],
          exerciseLink: row[2],
          imageLink: row[3],
        })
      ),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Get today's workout
   */
  public async getTodaysWorkout(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'todaysWorkout',
      {},
      () => sheetsApi.fetchTodaysWorkout(),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Get workout logs
   */
  public async getWorkoutLogs(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'workoutLogs',
      {},
      () => sheetsApi.fetchData("Workout_Logs!A2:F", "/api/workout"),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Get todos
   */
  public async getTodos(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'todos',
      {},
      () => sheetsApi.fetchTodos(),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Get body measurements
   */
  public async getBodyMeasurements(forceRefresh = false): Promise<ApiResult> {
    return this.getData(
      'bodyMeasurements',
      {},
      () => sheetsApi.fetchData(
        "Body_Measurements!A2:AC",
        "/api/bodymeasurements"
      ),
      { bypassCache: forceRefresh }
    );
  }
  
  /**
   * Batch fetch data from multiple sources
   */
  public async batchFetchData(
    requests: Array<{
      range: string;
      cacheKey: string;
      mapFn?: (row: any) => any;
    }>
  ): Promise<Record<string, { data: any; error: Error | null }>> {
    return sheetsApi.batchFetchData(requests);
  }
  
  /**
   * Save workout template
   */
  public async saveWorkoutTemplate(template: any): Promise<ApiResult> {
    const result = await sheetsApi.saveWorkoutTemplate(template);
    // Invalidate cache on successful save
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutTemplates', {}));
    }
    return result;
  }
  
  /**
   * Update workout template
   */
  public async updateWorkoutTemplate(template: any): Promise<ApiResult> {
    const result = await sheetsApi.updateWorkoutTemplate(template);
    // Invalidate cache on successful update
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutTemplates', {}));
    }
    return result;
  }
  
  /**
   * Delete workout template
   */
  public async deleteWorkoutTemplate(templateId: string | number): Promise<ApiResult> {
    const result = await sheetsApi.deleteWorkoutTemplate(templateId);
    // Invalidate cache on successful delete
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutTemplates', {}));
    }
    return result;
  }
  
  /**
   * Save body measurement
   */
  public async saveBodyMeasurement(measurement: any): Promise<ApiResult> {
    const result = await sheetsApi.saveBodyMeasurementToSheet(measurement);
    // Invalidate cache on successful save
    if (result.success) {
      this.cache.delete(this.getCacheKey('bodyMeasurements', {}));
    }
    return result;
  }
  
  /**
   * Add a workout log
   */
  public async addWorkoutLog(log: any[]): Promise<ApiResult> {
    const result = await sheetsApi.appendData('Workout_Logs!A:F', [log]);
    // Invalidate cache on successful add
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutLogs', {}));
    }
    return result;
  }
  
  /**
   * Update a workout log
   */
  public async updateWorkoutLog(index: number, log: any[]): Promise<ApiResult> {
    const result = await sheetsApi.updateData(`Workout_Logs!A${index + 2}:F${index + 2}`, [log]);
    // Invalidate cache on successful update
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutLogs', {}));
    }
    return result;
  }
  
  /**
   * Delete a workout log
   */
  public async deleteWorkoutLog(index: number): Promise<ApiResult> {
    const result = await sheetsApi.deleteData(`Workout_Logs!A${index + 2}:F${index + 2}`);
    // Invalidate cache on successful delete
    if (result.success) {
      this.cache.delete(this.getCacheKey('workoutLogs', {}));
    }
    return result;
  }
  
  /**
   * Complete today's workout
   */
  public async completeWorkout(workout: any): Promise<ApiResult> {
    const result = await sheetsApi.completeWorkout(workout);
    // Invalidate cache on successful complete
    if (result.success) {
      this.cache.delete(this.getCacheKey('todaysWorkout', {}));
    }
    return result;
  }
  
  /**
   * Prefetch data in the background
   */
  public prefetchData(
    resourceType: string,
    params: any = {},
    fetcher: () => Promise<ApiResult>,
  ): void {
    const cacheKey = this.getCacheKey(resourceType, params);
    
    // Only queue if not already cached
    if (!this.cache.has(cacheKey)) {
      this.prefetchQueue.push(cacheKey);
      this.processPrefetchQueue(fetcher);
    }
  }
  
  /**
   * Process prefetch queue
   */
  private async processPrefetchQueue(fetcher: () => Promise<ApiResult>): Promise<void> {
    // Prevent multiple simultaneous prefetches
    if (this.isPrefetching || this.prefetchQueue.length === 0) {
      return;
    }
    
    this.isPrefetching = true;
    
    try {
      // Process prefetch queue one by one with low priority
      while (this.prefetchQueue.length > 0) {
        const cacheKey = this.prefetchQueue.shift();
        
        // Skip if already cached
        if (cacheKey && !this.cache.has(cacheKey)) {
          try {
            const result = await fetcher();
            if (result.success && result.data) {
              this.cache.set(cacheKey, {
                data: result.data,
                timestamp: Date.now(),
                expiresAt: Date.now() + DEFAULT_CACHE_TTL
              });
              console.log(`Prefetched ${cacheKey}`);
            }
          } catch (error) {
            console.warn(`Failed to prefetch ${cacheKey}:`, error);
          }
        }
        
        // Small delay to avoid blocking UI
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      this.isPrefetching = false;
    }
  }
  
  /**
   * Clear all cache data
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Export a singleton instance
export default DataService.getInstance();