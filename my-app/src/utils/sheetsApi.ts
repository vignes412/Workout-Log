// sheetsApi.ts
import config from '../config';

// Add type declaration for Google API client
declare global {
  interface Window {
    gapi: typeof gapi;
  }
}

interface GoogleApiClient {
  load(apiName: string, callback: () => void): void;
  client: {
    init(options: {
      apiKey: string;
      clientId: string;
      discoveryDocs: string[];
      scope: string;
    }): Promise<void>;
    setToken(token: { access_token: string }): void;
    sheets: {
      spreadsheets: {
        values: {
          get(params: {
            spreadsheetId: string;
            range: string;
          }): Promise<{
            result: {
              values?: any[][];
            };
          }>;
          append(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            resource: { values: any[][] };
          }): Promise<{
            result: any;
          }>;
          update(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            resource: { values: any[][] };
          }): Promise<{
            result: any;
          }>;
          clear(params: {
            spreadsheetId: string;
            range: string;
          }): Promise<{
            result: any;
          }>;
        };
        get(params: {
          spreadsheetId: string;
        }): Promise<{
          result: {
            sheets?: Array<{
              properties?: {
                title?: string;
                [key: string]: any;
              };
            }>;
          };
        }>;
        batchUpdate(params: {
          spreadsheetId: string;
          resource: any;
        }): Promise<any>;
      };
    };
    newBatch(): {
      add(request: any, options: { id: string }): void;
      execute(): Promise<{
        result: Record<string, {
          status: number;
          result: {
            values?: any[][];
          };
        }>;
      }>;
    };
  };
}

declare const gapi: GoogleApiClient;

// Define interface for IndexedDB with Promise
interface IDBPDatabase {
  transaction(
    storeNames: string | string[],
    mode?: IDBTransactionMode,
    options?: { durability?: "default" | "relaxed" | "strict" }
  ): IDBPTransaction;
  objectStoreNames: DOMStringList;
  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBPObjectStore;
  close(): void;
}

interface IDBPTransaction {
  complete: Promise<void>;
  objectStore(name: string): IDBPObjectStore;
  abort(): void;
}

interface IDBPObjectStore {
  get(key: IDBValidKey): Promise<any>;
  getAll(): Promise<any[]>;
  put(value: any, key?: IDBValidKey): Promise<IDBValidKey>;
  add(value: any, key?: IDBValidKey): Promise<IDBValidKey>;
  delete(key: IDBValidKey): Promise<void>;
}

// Define types for API requests and responses
export interface ApiResponse<T = any> {
  data: T | null;
  success: boolean;
  fromCache?: boolean;
  error?: Error | null;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  cache?: RequestCache;
}

export interface PendingMutation {
  id: string;
  timestamp: number;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }
}

interface RequestQueueItem {
  id: string;
  promise: Promise<ApiResponse>;
  timestamp: number;
}

const { SPREADSHEET_ID, CLIENT_ID, API_KEY } = config.google;
const { DATA_CACHE_NAME } = config.cache;

// In-memory request queue to deduplicate in-flight requests
const requestQueue: Record<string, RequestQueueItem> = {};

// Queue for storing failed mutations when offline
let pendingMutations: PendingMutation[] = [];

// Network status tracking
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
  isOnline = true;
  processPendingMutations();
});
window.addEventListener('offline', () => {
  isOnline = false;
});

/**
 * Initialize the Google API client
 * @param accessToken Access token for authorization
 * @returns Promise resolving when client is initialized
 */
export const initClient = async (accessToken: string): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: config.google.DISCOVERY_DOCS,
            scope: config.google.SCOPES,
          });
          
          if (accessToken) {
            gapi.client.setToken({ access_token: accessToken });
          }
          
          resolve();
        } catch (error) {
          console.error('Error initializing GAPI client:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Failed to initialize Google API client:', error);
    throw error;
  }
};

/**
 * Check if the current user is offline
 * @returns Boolean indicating if user is offline
 */
export const useOnlineStatus = (): boolean => {
  return isOnline;
};

/**
 * Generate a unique request ID for deduplication
 * @param url Request URL
 * @param method HTTP method
 * @param body Request body
 * @returns A unique string ID for the request
 */
const getRequestId = (url: string, method: string, body?: any): string => {
  return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
};

/**
 * Perform a fetch request with retry capability
 * @param url Request URL 
 * @param options Request options
 * @param retries Number of retries
 * @param backoffMs Base backoff time in milliseconds
 * @returns Promise resolving to fetch response
 */
const fetchWithRetry = async (
  url: string, 
  options: RequestOptions = {}, 
  retries = 3,
  backoffMs = 300
): Promise<Response> => {
  try {
    const response = await fetch(url, options as RequestInit);
    
    if (!response.ok && retries > 0) {
      // Calculate exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 range for jitter
      const delay = Math.min(backoffMs * Math.pow(2, 3 - retries) * jitter, 10000);
      
      console.log(`Request failed with status ${response.status}, retrying in ${delay.toFixed(0)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return fetchWithRetry(url, options, retries - 1, backoffMs);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      // Calculate exponential backoff with jitter for network errors
      const jitter = Math.random() * 0.3 + 0.85;
      const delay = Math.min(backoffMs * Math.pow(2, 3 - retries) * jitter, 10000);
      
      console.log(`Network error, retrying in ${delay.toFixed(0)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return fetchWithRetry(url, options, retries - 1, backoffMs);
    }
    
    throw error;
  }
};

/**
 * Execute a network request with caching and retry
 * @param url Request URL
 * @param options Request options
 * @param useCache Whether to use cache
 * @returns Promise resolving to API response
 */
export const executeRequest = async <T>(
  url: string,
  options: RequestOptions = {},
  useCache = true
): Promise<ApiResponse<T>> => {
  const method = options.method || 'GET';
  const requestId = getRequestId(url, method, options.body);
  
  // If we already have this request in flight, return the existing promise
  if (requestQueue[requestId] && requestQueue[requestId].timestamp > Date.now() - 30000) {
    console.log('Deduplicated request:', requestId);
    return requestQueue[requestId].promise as Promise<ApiResponse<T>>;
  }
  
  // For mutations, if offline, queue them for later and return optimistic response
  if (method !== 'GET' && !isOnline) {
    console.log('Offline mutation detected, queueing for later:', requestId);
    
    // Add to pending mutations
    const pendingMutation: PendingMutation = {
      id: requestId,
      timestamp: Date.now(),
      request: {
        url,
        method,
        headers: options.headers || {},
        body: options.body
      }
    };
    
    pendingMutations.push(pendingMutation);
    
    // Store in IndexedDB for persistence
    try {
      const db = await openMutationDatabase();
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      await store.add(pendingMutation);
      await tx.complete;
    } catch (error) {
      console.error('Failed to store pending mutation:', error);
    }
    
    // Return optimistic response
    return { success: true, data: null };
  }
  
  // Create the network request promise
  const requestPromise = async (): Promise<ApiResponse<T>> => {
    // Check cache first
    if (useCache && method === 'GET') {
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          const data = await cachedResponse.json();
          console.log('Serving from cache:', url);
          return { success: true, data, fromCache: true };
        }
      } catch (cacheError) {
        console.warn('Cache access failed:', cacheError);
      }
    }
    
    // If offline and it's a GET request, return failure
    if (!isOnline && method === 'GET') {
      return { success: false, data: null, error: new Error('Offline') };
    }
    
    // Perform the network request with retry
    try {
      const response = await fetchWithRetry(url, options);
      
      // Process the response
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        let data: T | null = null;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          
          // Cache successful GET responses
          if (method === 'GET' && useCache) {
            try {
              const cache = await caches.open(DATA_CACHE_NAME);
              await cache.put(url, new Response(JSON.stringify(data)));
            } catch (cacheError) {
              console.warn('Failed to cache response:', cacheError);
            }
          }
        }
        
        return { success: true, data };
      } else {
        return { 
          success: false, 
          data: null, 
          error: new Error(`Request failed with status: ${response.status}`) 
        };
      }
    } catch (error) {
      console.error('Request error:', error);
      return { success: false, data: null, error: error as Error };
    } finally {
      // Remove this request from the queue after completion
      setTimeout(() => {
        delete requestQueue[requestId];
      }, 100);
    }
  };
  
  // Add request to the queue
  const promise = requestPromise();
  requestQueue[requestId] = { 
    id: requestId, 
    promise, 
    timestamp: Date.now() 
  };
  
  return promise;
};

/**
 * Open IndexedDB for storing mutations
 */
const openMutationDatabase = async (): Promise<IDBPDatabase> => {
  return new Promise<IDBPDatabase>((resolve, reject) => {
    const request = indexedDB.open('workout-mutations', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => {
      // Create a wrapper object that implements the IDBPDatabase interface
      const nativeDB = request.result;
      const db: IDBPDatabase = {
        transaction(storeNames, mode?, options?) {
          const tx = nativeDB.transaction(storeNames, mode, options);
          // Create a wrapper that implements IDBPTransaction
          const wrappedTx: IDBPTransaction = {
            complete: new Promise<void>((resolve, reject) => {
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
              tx.onabort = () => reject(new Error('Transaction aborted'));
            }),
            objectStore(name) {
              const store = tx.objectStore(name);
              // Create a wrapper that implements IDBPObjectStore
              const wrappedStore: IDBPObjectStore = {
                get(key) {
                  return new Promise((resolve, reject) => {
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                  });
                },
                getAll() {
                  return new Promise((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                  });
                },
                put(value, key?) {
                  return new Promise((resolve, reject) => {
                    const request = store.put(value, key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                  });
                },
                add(value, key?) {
                  return new Promise((resolve, reject) => {
                    const request = store.add(value, key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                  });
                },
                delete(key) {
                  return new Promise((resolve, reject) => {
                    const request = store.delete(key);
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                  });
                }
              };
              return wrappedStore;
            },
            abort() {
              tx.abort();
            }
          };
          return wrappedTx;
        },
        objectStoreNames: nativeDB.objectStoreNames,
        createObjectStore(name, options?) {
          return nativeDB.createObjectStore(name, options) as unknown as IDBPObjectStore;
        },
        close() {
          nativeDB.close();
        }
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Process any pending mutations when back online
 */
export const processPendingMutations = async (): Promise<void> => {
  if (!isOnline || pendingMutations.length === 0) return;
  
  console.log(`Processing ${pendingMutations.length} pending mutations...`);
  
  // Get a local copy and clear the main array
  const mutations = [...pendingMutations];
  pendingMutations = [];
  
  // Process each mutation
  for (const mutation of mutations) {
    try {
      console.log('Processing mutation:', mutation.id);
      
      await executeRequest(mutation.request.url, {
        method: mutation.request.method,
        headers: mutation.request.headers,
        body: mutation.request.body
      });
      
      // Remove from IndexedDB after successful processing
      const db = await openMutationDatabase();
      const tx = db.transaction('mutations', 'readwrite');
      await tx.objectStore('mutations').delete(mutation.id);
      await tx.complete;
    } catch (error) {
      console.error('Failed to process mutation:', error);
      
      // Re-queue failed mutations
      pendingMutations.push(mutation);
    }
  }
  
  console.log('Finished processing mutations, remaining:', pendingMutations.length);
};

/**
 * Load pending mutations from IndexedDB on app initialization
 */
export const loadPendingMutations = async (): Promise<void> => {
  try {
    const db = await openMutationDatabase();
    const tx = db.transaction('mutations', 'readonly');
    const store = tx.objectStore('mutations');
    const mutations = await store.getAll();
    
    if (mutations.length > 0) {
      console.log(`Loaded ${mutations.length} pending mutations from storage`);
      pendingMutations = [...mutations];
      
      // Process them if we're online
      if (isOnline) {
        processPendingMutations();
      }
    }
  } catch (error) {
    console.error('Failed to load pending mutations:', error);
  }
};

/**
 * Synchronize data with Google Sheets
 * @param range The sheet range to fetch
 * @param cacheKey The key to use for caching
 * @param callback Callback to handle the response data
 */
export const syncData = async (
  range: string, 
  cacheKey: string, 
  callback?: (data: any) => void
): Promise<ApiResponse> => {
  try {
    // Ensure we're initialized
    if (!gapi.client.sheets) {
      throw new Error('Google Sheets API not initialized');
    }
    
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    
    const values = response.result.values || [];
    
    // Cache the response
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(cacheKey, new Response(JSON.stringify(values)));
    } catch (cacheError) {
      console.warn('Failed to cache data:', cacheError);
    }
    
    // Call the callback if provided
    if (callback && typeof callback === 'function') {
      callback(values);
    }
    
    return { success: true, data: values };
  } catch (error) {
    console.error('Error in syncData:', error);
    
    // Try to load from cache as fallback
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      const cachedResponse = await cache.match(cacheKey);
      
      if (cachedResponse) {
        const data = await cachedResponse.json();
        
        if (callback && typeof callback === 'function') {
          callback(data);
        }
        
        return { success: true, data, fromCache: true };
      }
    } catch (cacheError) {
      console.error('Cache fallback failed:', cacheError);
    }
    
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Fetch data from Google Sheets API
 * @param range The sheet range to fetch
 * @param cacheKey Optional cache key to use
 * @param mapFn Optional function to map each row
 * @returns Promise resolving to API response
 */
export const fetchData = async <T>(
  range: string,
  cacheKey?: string,
  mapFn?: (row: any[]) => T
): Promise<ApiResponse<T[]>> => {
  // Use provided cacheKey or default based on range
  const actualCacheKey = cacheKey || `/api/${range.split('!')[0].toLowerCase()}`;
  
  try {
    // Check cache first
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      const cachedResponse = await cache.match(actualCacheKey);
      
      if (cachedResponse) {
        let data: any[] = await cachedResponse.json();
        
        if (mapFn && typeof mapFn === 'function') {
          data = Array.isArray(data) ? data.map(mapFn) : data;
        }
        
        return { success: true, data: data as T[], fromCache: true };
      }
    } catch (cacheError) {
      console.warn('Cache access failed:', cacheError);
    }
    
    // Fetch from API
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    
    let values: any[][] = response.result.values || [];
    
    // Apply mapping function if provided
    let mappedValues: T[] = [];
    if (mapFn && typeof mapFn === 'function') {
      mappedValues = values.map(mapFn);
    } else {
      mappedValues = values as unknown as T[];
    }
    
    // Cache the response
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(actualCacheKey, new Response(JSON.stringify(values)));
    } catch (cacheError) {
      console.warn('Failed to cache data:', cacheError);
    }
    
    return { success: true, data: mappedValues };
  } catch (error) {
    console.error('Error in fetchData:', error);
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Append data to a Google Sheet with better validation
 * @param range The sheet range to append to
 * @param values The values to append
 */
export const appendData = async (
  range: string, 
  values: any[][]
): Promise<ApiResponse> => {
  // Input validation
  if (!range || typeof range !== 'string') {
    console.error('Invalid range provided to appendData:', range);
    return { success: false, data: null, error: new Error('Invalid range format') };
  }
  
  if (!Array.isArray(values) || !values.length) {
    console.error('Invalid values provided to appendData:', values);
    return { success: false, data: null, error: new Error('Invalid values format') };
  }
  
  // Ensure all values are properly formatted
  const sanitizedValues = values.map(row => {
    if (!Array.isArray(row)) {
      console.warn('Row is not an array, converting:', row);
      return [String(row)];
    }
    
    return row.map(cell => {
      // Handle null/undefined
      if (cell === null || cell === undefined) {
        return '';
      }
      
      // Handle numeric values, ensure they're properly formatted for the API
      if (typeof cell === 'number') {
        return String(cell);
      }
      
      // Handle boolean values
      if (typeof cell === 'boolean') {
        return cell ? 'TRUE' : 'FALSE';
      }
      
      // Handle objects (like JSON data)
      if (typeof cell === 'object') {
        try {
          return JSON.stringify(cell);
        } catch (e) {
          console.warn('Could not stringify object, converting to empty string:', cell);
          return '';
        }
      }
      
      // Default to string
      return String(cell);
    });
  });
  
  // Optimistically update cache first
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const cacheKey = `/api/${range.split('!')[0].toLowerCase()}`;
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      const updatedData = [...cachedData, ...sanitizedValues];
      await cache.put(cacheKey, new Response(JSON.stringify(updatedData)));
    }
  } catch (cacheError) {
    console.warn('Failed to update cache for append operation:', cacheError);
  }
  
  // If offline, queue the mutation
  if (!isOnline) {
    const pendingMutation: PendingMutation = {
      id: `append:${range}:${Date.now()}`,
      timestamp: Date.now(),
      request: {
        url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: sanitizedValues,
          valueInputOption: 'USER_ENTERED',
        }),
      },
    };
    
    pendingMutations.push(pendingMutation);
    
    // Store in IndexedDB
    try {
      const db = await openMutationDatabase();
      const tx = db.transaction('mutations', 'readwrite');
      await tx.objectStore('mutations').add(pendingMutation);
      await tx.complete;
    } catch (error) {
      console.error('Failed to store pending mutation:', error);
    }
    
    return { success: true, data: null };
  }
  
  // Otherwise perform the append operation
  try {
    console.log('Appending data to sheets:', range, sanitizedValues);
    
    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: sanitizedValues },
    });
    
    return { success: true, data: response.result };
  } catch (error) {
    console.error('Error in appendData:', error);
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Update data in a Google Sheet
 * @param range The sheet range to update
 * @param values The values to update
 */
export const updateData = async (
  range: string, 
  values: any[][]
): Promise<ApiResponse> => {
  // Optimistically update cache
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const cacheKey = `/api/${range.split('!')[0].toLowerCase()}`;
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      // This is a simplistic approach - in a real app you'd need to
      // determine how to merge the updated values into the cached data
      const cachedData = await cachedResponse.json();
      // For now, just put the updated cache
      await cache.put(cacheKey, new Response(JSON.stringify(cachedData)));
    }
  } catch (cacheError) {
    console.warn('Failed to update cache for update operation:', cacheError);
  }
  
  // If offline, queue the mutation
  if (!isOnline) {
    const pendingMutation: PendingMutation = {
      id: `update:${range}:${Date.now()}`,
      timestamp: Date.now(),
      request: {
        url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
          valueInputOption: 'USER_ENTERED',
        }),
      },
    };
    
    pendingMutations.push(pendingMutation);
    
    // Store in IndexedDB
    try {
      const db = await openMutationDatabase();
      const tx = db.transaction('mutations', 'readwrite');
      await tx.objectStore('mutations').add(pendingMutation);
      await tx.complete;
    } catch (error) {
      console.error('Failed to store pending mutation:', error);
    }
    
    return { success: true, data: null };
  }
  
  // Otherwise perform the update operation
  try {
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    
    return { success: true, data: response.result };
  } catch (error) {
    console.error('Error in updateData:', error);
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Delete data from a Google Sheet
 * @param range The sheet range to clear
 */
export const deleteData = async (range: string): Promise<ApiResponse> => {
  // If offline, queue the mutation
  if (!isOnline) {
    const pendingMutation: PendingMutation = {
      id: `clear:${range}:${Date.now()}`,
      timestamp: Date.now(),
      request: {
        url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:clear`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    };
    
    pendingMutations.push(pendingMutation);
    
    // Store in IndexedDB
    try {
      const db = await openMutationDatabase();
      const tx = db.transaction('mutations', 'readwrite');
      await tx.objectStore('mutations').add(pendingMutation);
      await tx.complete;
    } catch (error) {
      console.error('Failed to store pending mutation:', error);
    }
    
    return { success: true, data: null };
  }
  
  // Otherwise perform the clear operation
  try {
    const response = await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    
    return { success: true, data: response.result };
  } catch (error) {
    console.error('Error in deleteData:', error);
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Batch fetch multiple ranges from Google Sheets
 * @param requests Array of batch fetch requests
 */
export const batchFetchData = async (
  requests: Array<{
    range: string;
    cacheKey: string;
    mapFn?: (row: any) => any;
  }>
): Promise<Record<string, { data: any; error: Error | null }>> => {
  const result: Record<string, { data: any; error: Error | null }> = {};
  
  // If we're offline, try to serve everything from cache
  if (!isOnline) {
    for (const request of requests) {
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const cachedResponse = await cache.match(request.cacheKey);
        
        if (cachedResponse) {
          let data = await cachedResponse.json();
          
          if (request.mapFn && typeof request.mapFn === 'function') {
            data = Array.isArray(data) ? data.map(request.mapFn) : data;
          }
          
          result[request.cacheKey] = { data, error: null };
        } else {
          result[request.cacheKey] = { 
            data: null, 
            error: new Error('Data not available offline') 
          };
        }
      } catch (error) {
        console.error('Error fetching from cache:', error);
        result[request.cacheKey] = { data: null, error: error as Error };
      }
    }
    
    return result;
  }
  
  // Create batch request for each range
  try {
    const batch = gapi.client.newBatch();
    
    requests.forEach((request, index) => {
      batch.add(
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: request.range,
        }),
        { id: `request-${index}` }
      );
    });
    
    const response = await batch.execute();
    
    // Process each response in the batch
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const batchResponse = response.result[`request-${i}`];
      
      if (batchResponse.status === 200) {
        let data = batchResponse.result.values || [];
        
        if (request.mapFn && typeof request.mapFn === 'function') {
          data = data.map(request.mapFn);
        }
        
        // Cache the result
        try {
          const cache = await caches.open(DATA_CACHE_NAME);
          await cache.put(request.cacheKey, new Response(JSON.stringify(data)));
        } catch (cacheError) {
          console.warn('Failed to cache batch response:', cacheError);
        }
        
        result[request.cacheKey] = { data, error: null };
      } else {
        result[request.cacheKey] = { 
          data: null, 
          error: new Error(`Request failed with status: ${batchResponse.status}`)
        };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in batchFetchData:', error);
    
    // Try to serve from cache as fallback
    for (const request of requests) {
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        const cachedResponse = await cache.match(request.cacheKey);
        
        if (cachedResponse) {
          let data = await cachedResponse.json();
          
          if (request.mapFn && typeof request.mapFn === 'function') {
            data = Array.isArray(data) ? data.map(request.mapFn) : data;
          }
          
          result[request.cacheKey] = { data, error: null };
        } else {
          result[request.cacheKey] = { 
            data: null, 
            error: error as Error
          };
        }
      } catch (cacheError) {
        console.error('Error fetching from cache as fallback:', cacheError);
        result[request.cacheKey] = { 
          data: null, 
          error: cacheError as Error || error as Error 
        };
      }
    }
    
    return result;
  }
};

/**
 * Ensure that a sheet exists in the spreadsheet
 * @param sheetName The name of the sheet to check/create
 * @param headers Optional array of header column names to add if sheet is created
 * @returns Promise resolving to true if sheet exists or was created
 */
export const ensureSheetExists = async (sheetName: string, headers?: string[]): Promise<boolean> => {
  try {
    const response = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    const sheets = response.result.sheets || [];
    const sheetExists = sheets.some((sheet: any) => sheet.properties?.title === sheetName);
    
    if (sheetExists) {
      return true;
    }
    
    // If sheet doesn't exist, create it
    const addSheetResponse = await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      }
    });
    
    // If headers are provided, add them as the first row
    if (headers && headers.length > 0) {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureSheetExists:', error);
    return false;
  }
};

/**
 * Fetch todos from the spreadsheet
 * @returns Promise resolving to todos data
 */
export const fetchTodos = async (): Promise<ApiResponse> => {
  return fetchData('Todos!A2:D', undefined, (row) => ({
    id: row[0],
    text: row[1],
    completed: row[2] === 'TRUE',
    timestamp: row[3]
  }));
};

/**
 * Append a new todo to the spreadsheet
 * @param todo Todo data to append
 * @returns Promise resolving to API response
 */
export const appendTodo = async (todo: { text: string }): Promise<ApiResponse> => {
  const id = Date.now().toString();
  const values = [[id, todo.text, 'FALSE', new Date().toISOString()]];
  
  return appendData('Todos!A2:D', values);
};

/**
 * Update a todo in the spreadsheet
 * @param todoIndex Index of the todo to update
 * @param updatedTodo Updated todo data
 * @returns Promise resolving to API response
 */
export const updateTodo = async (todoIndex: number, updatedTodo: { text: string, completed: boolean, id?: string, timestamp?: string }): Promise<ApiResponse> => {
  try {
    // Using index and updated todo directly
    const rowIndex = todoIndex + 2; // Add 2 because sheet data starts at A2
    const range = `Todos!A${rowIndex}:D${rowIndex}`;
    
    const values = [[
      updatedTodo.id || '',
      updatedTodo.text || '',
      updatedTodo.completed ? 'TRUE' : 'FALSE',
      updatedTodo.timestamp || new Date().toISOString()
    ]];
    
    return updateData(range, values);
  } catch (error) {
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Delete a todo from the spreadsheet
 * @param todoIndex Index of the todo to delete
 * @returns Promise resolving to API response
 */
export const deleteTodo = async (todoIndex: number): Promise<ApiResponse> => {
  try {
    // Using index and updated todo directly
    const rowIndex = todoIndex + 2; // Add 2 because sheet data starts at A2
    const range = `Todos!A${rowIndex}:D${rowIndex}`;
    
    return deleteData(range);
  } catch (error) {
    return { success: false, data: null, error: error as Error };
  }
};

/**
 * Cache data for offline use
 * @param key Cache key
 * @param data Data to cache
 * @returns Promise resolving when caching is complete
 */
export const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(key, new Response(JSON.stringify(data)));
  } catch (error) {
    console.error('Error caching data:', error);
    throw error;
  }
};

/**
 * Load data from cache
 * @param key Cache key
 * @returns Promise resolving to cached data or null
 */
export const loadCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(key);
    
    if (cachedResponse) {
      return await cachedResponse.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error loading cached data:', error);
    return null;
  }
};

/**
 * Fetch today's workout from the spreadsheet
 * @returns Promise resolving to today's workout data
 */
export const fetchTodaysWorkout = async (): Promise<ApiResponse> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return fetchData(`Workouts!A2:Z`, undefined, (row) => {
    const date = row[0];
    if (date === today) {
      return {
        date,
        name: row[1],
        exercises: JSON.parse(row[2] || '[]'),
        completed: row[3] === 'TRUE',
        notes: row[4] || ''
      };
    }
    return null;
  }).then(response => {
    if (response.success && response.data !== null) {
      // Filter out null values and get the first matching workout
      const workouts = response.data.filter(Boolean);
      return {
        ...response,
        data: workouts.length > 0 ? workouts[0] : null
      };
    }
    return response;
  });
};

/**
 * Save a new workout for today
 * @param workout Workout data to save
 * @returns Promise resolving to API response
 */
export const saveTodaysWorkout = async (workout: any): Promise<ApiResponse> => {
  const today = new Date().toISOString().split('T')[0];
  const values = [[
    today,
    workout.name,
    JSON.stringify(workout.exercises),
    'FALSE',
    workout.notes || ''
  ]];
  
  return appendData('Workouts!A2:E', values);
};

/**
 * Update today's workout in the spreadsheet
 * @param workout Updated workout data
 * @returns Promise resolving to API response
 */
export const updateTodaysWorkout = async (workout: any): Promise<ApiResponse> => {
  // Find today's workout to update
  const response = await fetchTodaysWorkout();
  
  if (!response.success) {
    return response;
  }
  
  // If no workout exists for today, create one
  if (!response.data) {
    return saveTodaysWorkout(workout);
  }
  
  // Fetch all workouts to find the correct row
  const allWorkouts = await fetchData('Workouts!A2:E');
  if (!allWorkouts.success || !allWorkouts.data) {
    return allWorkouts;
  }
  
  const today = new Date().toISOString().split('T')[0];
  // Use type assertion to ensure row is treated as an array with index access
  const index = allWorkouts.data.findIndex((row) => (row as unknown as any[])[0] === today);
  
  if (index === -1) {
    return saveTodaysWorkout(workout);
  }
  
  // Calculate row index (add 2 because we're starting at A2 and index is zero-based)
  const rowIndex = index + 2;
  const range = `Workouts!A${rowIndex}:E${rowIndex}`;
  
  const values = [[
    today,
    workout.name,
    JSON.stringify(workout.exercises),
    workout.completed ? 'TRUE' : 'FALSE',
    workout.notes || ''
  ]];
  
  return updateData(range, values);
};

/**
 * Mark a workout as completed
 * @param workout Workout to mark complete
 * @returns Promise resolving to API response
 */
export const completeWorkout = async (workout: any): Promise<ApiResponse> => {
  return updateTodaysWorkout({
    ...workout,
    completed: true
  });
};

/**
 * Fetch workout templates from the spreadsheet
 * @returns Promise resolving to workout templates data
 */
export const fetchWorkoutTemplates = async (): Promise<ApiResponse> => {
  return fetchData('WorkoutTemplates!A2:D', undefined, (row) => ({
    id: row[0],
    name: row[1],
    exercises: JSON.parse(row[2] || '[]'),
    notes: row[3] || ''
  }));
};

/**
 * Save a workout template to the spreadsheet
 * @param range The sheet range to use (optional, defaults to WorkoutTemplates!A2:D)
 * @param template Template data to save
 * @returns Promise resolving to API response
 */
export const saveWorkoutTemplate = async (
  templateOrRange: string | any,
  exercisesOrTemplate?: any
): Promise<ApiResponse> => {
  // Handle both usage patterns:
  // 1. saveWorkoutTemplate(template) - original
  // 2. saveWorkoutTemplate(range, template) - new
  
  let range = 'WorkoutTemplates!A2:D';
  let template: any;
  
  if (typeof templateOrRange === 'string' && exercisesOrTemplate) {
    // Called with (range, template)
    range = templateOrRange;
    if (Array.isArray(exercisesOrTemplate)) {
      // It's an array of exercises, build a template object
      template = {
        id: Date.now().toString(),
        name: 'New Template',
        exercises: exercisesOrTemplate,
        notes: ''
      };
    } else {
      // It's already a template object
      template = exercisesOrTemplate;
    }
  } else {
    // Called with just (template)
    template = templateOrRange;
  }
  
  const id = template.id || Date.now().toString();
  const values = [[
    id,
    template.name,
    JSON.stringify(template.exercises || []),
    template.notes || ''
  ]];
  
  return appendData(range, values);
};

/**
 * Update a workout template in the spreadsheet
 * @param indexOrTemplate Index of the template to update or the template object itself
 * @param updatedTemplate Updated template data (optional if first param is the template)
 * @returns Promise resolving to API response
 */
export const updateWorkoutTemplate = async (
  indexOrTemplate: number | string | any,
  updatedTemplate?: any
): Promise<ApiResponse> => {
  // Support both:
  // 1. updateWorkoutTemplate(template) - original
  // 2. updateWorkoutTemplate(index, template) - new
  
  let template: any;
  let index: number | null = null;
  
  if (typeof indexOrTemplate === 'number' && updatedTemplate) {
    // Called with (index, template)
    index = indexOrTemplate;
    template = updatedTemplate;
  } else if (typeof indexOrTemplate === 'string' && updatedTemplate) {
    // Called with (templateId, template)
    // We need to find the template index first
    template = updatedTemplate;
  } else {
    // Called with just (template)
    template = indexOrTemplate;
  }
  
  // If we don't have an index yet, find the template by ID
  if (index === null) {
    const templatesResponse = await fetchWorkoutTemplates();
    
    if (!templatesResponse.success || !templatesResponse.data) {
      return templatesResponse;
    }
    
    const templates = templatesResponse.data;
    const foundIndex = templates.findIndex((t: any) => t.id === (template.id || template.templateId));
    
    if (foundIndex === -1) {
      return { success: false, data: null, error: new Error('Template not found') };
    }
    
    index = foundIndex;
  }
  
  if (index === null) {
    return { success: false, data: null, error: new Error('Template not found') };
  }
  
  // Calculate row index (add 2 because we're starting at A2 and index is zero-based)
  const rowIndex = index + 2;
  const range = `WorkoutTemplates!A${rowIndex}:D${rowIndex}`;
  
  const values = [[
    template.id || template.templateId || Date.now().toString(),
    template.name,
    JSON.stringify(template.exercises || []),
    template.notes || ''
  ]];
  
  return updateData(range, values);
};

/**
 * Delete a workout template from the spreadsheet
 * @param templateIdOrIndex ID or index of the template to delete
 * @returns Promise resolving to API response
 */
export const deleteWorkoutTemplate = async (
  templateIdOrIndex: string | number
): Promise<ApiResponse> => {
  if (typeof templateIdOrIndex === 'number') {
    // Called with index - convert to row range directly
    const rowIndex = templateIdOrIndex + 2; // Add 2 because sheet data starts at A2
    const range = `WorkoutTemplates!A${rowIndex}:D${rowIndex}`;
    return deleteData(range);
  }
  
  // Called with ID - find the template first
  const templatesResponse = await fetchWorkoutTemplates();
  
  if (!templatesResponse.success || !templatesResponse.data) {
    return templatesResponse;
  }
  
  const templates = templatesResponse.data;
  const index = templates.findIndex((t: any) => t.id === templateIdOrIndex);
  
  if (index === -1) {
    return { success: false, data: null, error: new Error('Template not found') };
  }
  
  // Calculate row index (add 2 because sheet data starts at A2 and index is zero-based)
  const rowIndex = index + 2;
  const range = `WorkoutTemplates!A${rowIndex}:D${rowIndex}`;
  
  return deleteData(range);
};

/**
 * Save body measurement to the spreadsheet
 * @param measurement Measurement data to save
 * @returns Promise resolving to API response
 */
export const saveBodyMeasurementToSheet = async (measurement: any): Promise<ApiResponse> => {
  const today = new Date().toISOString().split('T')[0];
  const values = [[
    today,
    measurement.weight || '',
    measurement.bodyFat || '',
    measurement.chest || '',
    measurement.waist || '',
    measurement.hip || '',
    measurement.rightArm || '',
    measurement.leftArm || '',
    measurement.rightThigh || '',
    measurement.leftThigh || '',
    measurement.rightCalf || '',
    measurement.leftCalf || '',
    measurement.notes || ''
  ]];
  
  return appendData('BodyMeasurements!A2:M', values);
};

// Initialize pending mutations on load
loadPendingMutations();