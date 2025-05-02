import { gapi } from "gapi-script";
import React from 'react';
import config from "../config";
import { getAccessToken } from "../services/authService";

// Extract values from config
const { API_KEY, CLIENT_ID, SPREADSHEET_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

// Cache for in-flight requests to prevent duplicate API calls
const pendingRequests = new Map();

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second initial delay

// Enhanced retry operation with exponential backoff
export const retryOperation = async (operation, retries = MAX_RETRIES) => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      // Check if we've exhausted our retries
      if (attempt > retries) {
        throw error;
      }
      
      // Check if the error is retryable
      if (
        error.result?.error?.status === "UNAUTHENTICATED" ||
        error.result?.error?.status === "PERMISSION_DENIED" ||
        error.message === "Authentication required"
      ) {
        // These are auth errors, no point in retrying without fixing auth
        throw error;
      }
      
      // For rate limiting or temporary issues, wait with exponential backoff
      const isRateLimitError = 
        error.result?.error?.status === "RESOURCE_EXHAUSTED" ||
        error.result?.error?.code === 429;
        
      if (isRateLimitError && attempt === retries) {
        console.error("Rate limit reached, maximum retries exhausted");
        throw error;
      }
      
      // Exponential backoff with jitter to prevent thundering herd
      const exponentialDelay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      const delay = exponentialDelay + jitter;
      
      console.warn(`Retrying operation, attempt ${attempt}/${retries} after ${Math.round(delay)}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Enhanced client initialization with more robust error handling
export const initClient = async (accessToken) => {
  // Use a cached promise to deduplicate initialization requests
  if (pendingRequests.has('init')) {
    return pendingRequests.get('init');
  }
  
  const initPromise = new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }
    
    gapi.load("client", () => {
      gapi.client
        .init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY || API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        .then(() => {
          // Use the provided access token or get a fresh one
          const token = accessToken || localStorage.getItem("access_token");
          if (token) {
            gapi.client.setToken({ access_token: token });
            console.log(
              "GAPI Client Initialized with Spreadsheet ID:",
              SPREADSHEET_ID
            );
            isInitialized = true;
            resolve();
          } else {
            const error = new Error("No access token available");
            console.error(error);
            reject(error);
          }
        })
        .catch((error) => {
          console.error("GAPI Initialization Error:", error);
          reject(error);
        });
    });
  });
  
  // Store the promise and clean it up once resolved/rejected
  pendingRequests.set('init', initPromise);
  initPromise.finally(() => {
    pendingRequests.delete('init');
  });
  
  return initPromise;
};

// Helper to create a request key for deduplication
const createRequestKey = (operation, params) => {
  return `${operation}_${JSON.stringify(params)}`;
};

export const fetchData = async (range, mapFn = (row) => row) => {
  // Create a unique key for this request to deduplicate
  const requestKey = createRequestKey('fetch', { range });
  
  // If this exact request is already in flight, return the existing promise
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  
  const fetchPromise = retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before fetching data:", error);
      throw new Error("Authentication required");
    }
    
    const cacheKey = `${SPREADSHEET_ID}_${range}`;
    
    // Check if there's a background sync in progress for this data
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.warn("Service worker not available for background sync", error);
      }
    }
    
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range,
      });
      
      // Transform and return the data
      const mappedData = (response.result.values || []).map(mapFn);
      
      // Cache the fetched data
      await cacheData(cacheKey, mappedData);
      
      return mappedData;
    } catch (error) {
      // Try to load from cache if available when fetch fails
      try {
        const cachedData = await loadCachedData(cacheKey);
        if (cachedData) {
          console.log(`Loaded data for ${range} from cache after fetch failure`);
          return cachedData;
        }
      } catch (cacheError) {
        console.warn(`Cache fallback failed for ${range}:`, cacheError);
      }
      
      // Re-throw the original error if cache isn't available
      throw error;
    }
  });
  
  // Store the promise and clean it up once resolved/rejected
  pendingRequests.set(requestKey, fetchPromise);
  fetchPromise.finally(() => {
    pendingRequests.delete(requestKey);
  });
  
  return fetchPromise;
};

export const appendData = async (range, values, accessToken = null) => {
  return retryOperation(async () => {
    // Get a fresh token if none provided
    try {
      const token = accessToken || await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before appending data:", error);
      throw new Error("Authentication required");
    }
    
    // Ensure values is a two-dimensional array
    const formattedValues = Array.isArray(values[0]) ? values : [values];
    
    // If offline, store for background sync
    if (!navigator.onLine) {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          await storePendingMutation({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken || await getAccessToken()}`
            },
            body: {
              range,
              valueInputOption: "RAW",
              values: formattedValues
            }
          });
          
          await navigator.serviceWorker.ready;
          await navigator.serviceWorker.controller.postMessage({
            type: 'REGISTER_SYNC',
            tag: 'syncPendingData'
          });
          
          console.log("Queued data append for background sync");
          // Return a mock result for offline mode
          return { status: "pending", offline: true };
        }
      } catch (error) {
        console.error("Failed to queue offline mutation:", error);
      }
      
      throw new Error("Cannot append data while offline");
    }
    
    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: formattedValues },
    });
    
    console.log(`Appended data to ${range} successfully`);
    
    // Invalidate cache for this range
    const cacheKey = `${SPREADSHEET_ID}_${range}`;
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.delete(cacheKey);
    } catch (e) {
      console.warn(`Failed to invalidate cache for ${range}:`, e);
    }
    
    return response.result;
  });
};

export const clearSheet = async (range) => {
  return retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before clearing sheet:", error);
      throw new Error("Authentication required");
    }
    
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    
    // Invalidate cache for this range
    const cacheKey = `${SPREADSHEET_ID}_${range}`;
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.delete(cacheKey);
    } catch (e) {
      console.warn(`Failed to invalidate cache for ${range}:`, e);
    }
    
    console.log(`Cleared range ${range} successfully`);
  });
};

export const updateData = async (range, values, accessToken = null) => {
  return retryOperation(async () => {
    // Get a fresh token if none provided
    try {
      const token = accessToken || await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before updating data:", error);
      throw new Error("Authentication required");
    }
    
    // If offline, store for background sync
    if (!navigator.onLine) {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          await storePendingMutation({
            url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken || await getAccessToken()}`
            },
            body: {
              range,
              valueInputOption: "RAW",
              values
            }
          });
          
          await navigator.serviceWorker.ready;
          await navigator.serviceWorker.controller.postMessage({
            type: 'REGISTER_SYNC',
            tag: 'syncPendingData'
          });
          
          console.log("Queued data update for background sync");
          // Return a mock result for offline mode
          return { status: "pending", offline: true };
        }
      } catch (error) {
        console.error("Failed to queue offline mutation:", error);
      }
      
      throw new Error("Cannot update data while offline");
    }
    
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
    
    // Invalidate cache for this range
    const cacheKey = `${SPREADSHEET_ID}_${range}`;
    try {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.delete(cacheKey);
    } catch (e) {
      console.warn(`Failed to invalidate cache for ${range}:`, e);
    }
    
    console.log(`Updated range ${range} successfully`);
    return response.result;
  });
};

// Store pending mutations for background sync when online again
const storePendingMutation = async (mutationData) => {
  try {
    // Generate a unique ID for this mutation
    const mutationId = `mutation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Store in offline mutations cache
    const cache = await caches.open('offline-mutations');
    await cache.put(
      new Request(`/pending-mutations/${mutationId}`),
      new Response(JSON.stringify(mutationData))
    );
    
    return mutationId;
  } catch (error) {
    console.error('Failed to store pending mutation:', error);
    throw error;
  }
};

export const cacheData = async (cacheKey, data) => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(cacheKey, new Response(JSON.stringify(data)));
  } catch (error) {
    console.error(`Cache Error for ${cacheKey}:`, error);
  }
};

export const loadCachedData = async (cacheKey) => {
  try {
    const cacheResponse = await caches.match(cacheKey);
    if (cacheResponse) {
      return await cacheResponse.json();
    }
    return null;
  } catch (error) {
    console.error(`Load Cache Error for ${cacheKey}:`, error);
    return null;
  }
};

// Memoized hook for online status to prevent multiple listeners
export const useOnlineStatus = (setIsOffline) => {
  React.useEffect(() => {
    // Initial status check
    setIsOffline(!navigator.onLine);
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline]);
};

export const syncData = async (
  range,
  cacheKey,
  setData,
  mapFn = (row) => row
) => {
  if (typeof setData !== "function") {
    throw new Error("setData must be a function");
  }

  try {
    const data = await fetchData(range, mapFn);
    setData(data);
    await cacheData(cacheKey, data);
    return { success: true, data };
  } catch (error) {
    const cached = await loadCachedData(cacheKey);
    if (cached) {
      setData(cached);
      return { success: false, data: cached, fromCache: true };
    }
    console.error(`Sync error for ${range}:`, error);
    throw error; // Re-throw for UI notification
  }
};

export const saveBodyMeasurementToSheet = async (range, row, accessToken = null) => {
  // Simply use our improved appendData function
  return appendData(range, row, accessToken);
};

export const fetchTodos = async () => {
  return fetchData("ToDO", (row) => ({
    text: row[0],
    completed: row[1].toLowerCase() === "true",
  }));
};

export const appendTodo = async (todo) => {
  return appendData("ToDO", [todo.text, todo.completed.toString()]);
};

export const updateTodo = async (index, todo) => {
  return updateData(`ToDO!A${index + 2}:B${index + 2}`, [
    [todo.text, todo.completed.toString()],
  ]);
};

export const deleteTodo = async (index) => {
  return clearSheet(`ToDO!A${index + 2}:B${index + 2}`);
};
