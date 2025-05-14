import { gapi } from "gapi-script";
import React, { SetStateAction, Dispatch, useEffect } from 'react';
import config from "../config";
import { getAccessToken } from "../services/authService";

// Extract values from config
const { API_KEY, CLIENT_ID, SPREADSHEET_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

// Cache for in-flight requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>();

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1 second initial delay

interface RetryableError extends Error {
  result?: {
    error?: {
      status?: string;
      code?: number;
    }
  }
}

// Enhanced retry operation with exponential backoff
export const retryOperation = async <T>(operation: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      const typedError = error as RetryableError;
      
      // Check if we've exhausted our retries
      if (attempt > retries) {
        throw error;
      }
      
      // Check if the error is retryable
      if (
        typedError.result?.error?.status === "UNAUTHENTICATED" ||
        typedError.result?.error?.status === "PERMISSION_DENIED" ||
        typedError.message === "Authentication required"
      ) {
        // These are auth errors, no point in retrying without fixing auth
        throw error;
      }
      
      // For rate limiting or temporary issues, wait with exponential backoff
      const isRateLimitError = 
        typedError.result?.error?.status === "RESOURCE_EXHAUSTED" ||
        typedError.result?.error?.code === 429;
        
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
  
  // This should never be reached due to the throw in the loop
  throw new Error("Max retries exceeded");
};

// Enhanced client initialization with more robust error handling
export const initClient = async (accessToken: string): Promise<void> => {
  // Use a cached promise to deduplicate initialization requests
  if (pendingRequests.has('init')) {
    return pendingRequests.get('init') as Promise<void>;
  }
  
  const initPromise = new Promise<void>((resolve, reject) => {
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
        .catch((error: any) => {
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
const createRequestKey = (operation: string, params: Record<string, any>): string => {
  return `${operation}_${JSON.stringify(params)}`;
};

export const fetchData = async <T>(range: string, mapFn: (row: any[]) => T = (row: any[]) => row as unknown as T): Promise<T[]> => {
  // Create a unique key for this request to deduplicate
  const requestKey = createRequestKey('fetch', { range });
  
  // If this exact request is already in flight, return the existing promise
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) as Promise<T[]>;
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
        const cachedData = await loadCachedData<T[]>(cacheKey);
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

interface MutationData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

interface AppendResult {
  status?: string;
  offline?: boolean;
}

export const appendData = async (range: string, values: any[] | any[][], accessToken: string | null = null): Promise<AppendResult> => {
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

export const clearSheet = async (range: string): Promise<void> => {
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

interface UpdateResult {
  status?: string;
  offline?: boolean;
}

export const updateData = async (range: string, values: any[][], accessToken: string | null = null): Promise<UpdateResult> => {
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
const storePendingMutation = async (mutationData: MutationData): Promise<string> => {
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

export const cacheData = async <T>(cacheKey: string, data: T): Promise<void> => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(cacheKey, new Response(JSON.stringify(data)));
  } catch (error) {
    console.error(`Cache Error for ${cacheKey}:`, error);
  }
};

export const loadCachedData = async <T>(cacheKey: string): Promise<T | null> => {
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
export const useOnlineStatus = (setIsOffline: Dispatch<SetStateAction<boolean>>): void => {
  useEffect(() => {
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

interface SyncResult<T> {
  success: boolean;
  data: T;
  fromCache?: boolean;
}

export const syncData = async <T>(
  range: string,
  cacheKey: string,
  setData: Dispatch<SetStateAction<T>>,
  mapFn: (row: any[]) => any = (row: any[]) => row
): Promise<SyncResult<T>> => {
  if (typeof setData !== "function") {
    throw new Error("setData must be a function");
  }

  try {
    const data = await fetchData(range, mapFn);
    setData(data as unknown as T);
    await cacheData(cacheKey, data);
    return { success: true, data: data as unknown as T };
  } catch (error) {
    const cached = await loadCachedData<T>(cacheKey);
    if (cached) {
      setData(cached);
      return { success: false, data: cached, fromCache: true };
    }
    console.error(`Sync error for ${range}:`, error);
    throw error; // Re-throw for UI notification
  }
};

export const saveBodyMeasurementToSheet = async (range: string, row: any[] | any[][], accessToken: string | null = null): Promise<AppendResult> => {
  // Simply use our improved appendData function
  return appendData(range, row, accessToken);
};

interface Todo {
  text: string;
  completed: boolean;
}

export const fetchTodos = async (): Promise<Todo[]> => {
  return fetchData<Todo>("ToDO", (row: any[]): Todo => ({
    text: row[0],
    completed: row[1].toLowerCase() === "true",
  }));
};

export const appendTodo = async (todo: Todo): Promise<AppendResult> => {
  return appendData("ToDO", [todo.text, todo.completed.toString()]);
};

export const updateTodo = async (index: number, todo: Todo): Promise<UpdateResult> => {
  return updateData(`ToDO!A${index + 2}:B${index + 2}`, [
    [todo.text, todo.completed.toString()],
  ]);
};

export const deleteTodo = async (index: number): Promise<void> => {
  return clearSheet(`ToDO!A${index + 2}:B${index + 2}`);
};

// Check if a sheet exists in the spreadsheet
export const checkSheetExists = async (sheetName: string): Promise<boolean> => {
  return retryOperation(async () => {
    try {
      // Get a fresh token before making the request
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
      
      // Get the spreadsheet metadata which includes sheet information
      const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });
      
      // Check if the requested sheet exists in the spreadsheet
      const sheets = response.result.sheets || [];
      const sheetExists = sheets.some(sheet => 
        sheet.properties.title.toLowerCase() === sheetName.toLowerCase()
      );
      
      console.log(`Sheet "${sheetName}" ${sheetExists ? 'exists' : 'does not exist'}`);
      return sheetExists;
    } catch (error) {
      console.error(`Error checking if sheet "${sheetName}" exists:`, error);
      throw error;
    }
  });
};

// Create a new sheet in the spreadsheet
export const createSheet = async (sheetName: string, headers: string[] = []): Promise<any> => {
  return retryOperation(async () => {
    try {
      // Get a fresh token before making the request
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
      
      // First, add the sheet
      const addSheetResponse = await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }
          ]
        }
      });
      
      console.log(`Created new sheet "${sheetName}"`);
      
      // If headers are provided, add them to the first row
      if (headers && headers.length > 0) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
          valueInputOption: "RAW",
          resource: {
            values: [headers]
          }
        });
        
        console.log(`Added headers to sheet "${sheetName}"`);
      }
      
      return addSheetResponse.result;
    } catch (error) {
      console.error(`Error creating sheet "${sheetName}":`, error);
      throw error;
    }
  });
};

interface SheetExistsResult {
  created: boolean;
}

// Check if a sheet exists and create it if it doesn't
export const ensureSheetExists = async (sheetName: string, headers: string[] = []): Promise<SheetExistsResult> => {
  try {
    const exists = await checkSheetExists(sheetName);
    if (!exists) {
      await createSheet(sheetName, headers);
      return { created: true };
    }
    return { created: false };
  } catch (error) {
    console.error(`Error ensuring sheet "${sheetName}" exists:`, error);
    throw error;
  }
};

// WORKOUT TEMPLATES API FUNCTIONS

interface WorkoutTemplate {
  name: string;
  description: string;
  exercises: any[];
  createdAt: string;
  lastUsed: string;
  rowIndex?: number;
}

// Fetch all workout templates
export const fetchWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  // First ensure the WorkoutTemplates sheet exists with proper headers
  await ensureSheetExists("WorkoutTemplates", ["Name", "Description", "Exercises", "CreatedAt", "LastUsed"]);
  
  return fetchData<WorkoutTemplate>("WorkoutTemplates!A2:E", (row: any[]): WorkoutTemplate => ({
    name: row[0] || '',
    description: row[1] || '',
    exercises: row[2] ? JSON.parse(row[2]) : [],
    createdAt: row[3] || new Date().toISOString(),
    lastUsed: row[4] || '',
    rowIndex: 0 // Will be set properly in the mapping function outside
  }));
};

// Save a new workout template
export const saveWorkoutTemplate = async (templateName: string, exercises: any[], description: string = ''): Promise<AppendResult> => {
  await ensureSheetExists("WorkoutTemplates", ["Name", "Description", "Exercises", "CreatedAt", "LastUsed"]);
  
  // Format the template data for the sheet
  const templateRow = [
    templateName,
    description,
    JSON.stringify(exercises),
    new Date().toISOString(),
    '' // lastUsed is empty for new templates
  ];
  
  return appendData("WorkoutTemplates", templateRow);
};

// Update an existing workout template
export const updateWorkoutTemplate = async (index: number, template: WorkoutTemplate): Promise<UpdateResult> => {
  // Format the template data for the sheet
  const templateRow = [
    template.name,
    template.description,
    JSON.stringify(template.exercises),
    template.createdAt || new Date().toISOString(),
    template.lastUsed || new Date().toISOString()
  ];
  
  return updateData(`WorkoutTemplates!A${index + 2}:E${index + 2}`, [templateRow]);
};

// Delete a workout template
export const deleteWorkoutTemplate = async (index: number): Promise<void> => {
  return clearSheet(`WorkoutTemplates!A${index + 2}:E${index + 2}`);
};

// TODAY'S WORKOUT API FUNCTIONS

interface TodaysWorkout {
  date: string;
  workoutData: any;
  completed: boolean;
  notes: string;
  rowIndex?: number;
}

// Fetch today's workout 
export const fetchTodaysWorkout = async (): Promise<TodaysWorkout | undefined> => {
  await ensureSheetExists("TodaysWorkout", ["Date", "WorkoutData", "Completed", "Notes"]);
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all workouts
  const workouts = await fetchData<TodaysWorkout>("TodaysWorkout!A2:D", (row: any[]): TodaysWorkout => ({
    date: row[0] || '',
    workoutData: row[1] ? JSON.parse(row[1]) : {},
    completed: row[2] === 'true',
    notes: row[3] || '',
    rowIndex: 0 // Will be set properly in the mapping function outside
  }));
  
  // Find today's workout if it exists
  return workouts.find(workout => workout.date === today);
};

// Save today's workout
export const saveTodaysWorkout = async (workoutData: any): Promise<AppendResult | UpdateResult> => {
  await ensureSheetExists("TodaysWorkout", ["Date", "WorkoutData", "Completed", "Notes"]);
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Check if a workout for today already exists
  const todaysWorkout = await fetchTodaysWorkout();
  
  // Format workout data
  const workoutRow = [
    today,
    JSON.stringify(workoutData),
    'false',
    ''
  ];
  
  if (todaysWorkout) {
    // If today's workout exists, update it
    const allWorkouts = await fetchData("TodaysWorkout!A2:D");
    const index = allWorkouts.findIndex(row => row[0] === today);
    if (index !== -1) {
      return updateData(`TodaysWorkout!A${index + 2}:D${index + 2}`, [workoutRow]);
    }
  }
  
  // If not found, create a new entry
  return appendData("TodaysWorkout", workoutRow);
};

// Update today's workout (e.g., mark sets as completed or update progress)
export const updateTodaysWorkout = async (workoutData: any, completed: boolean = false, notes: string = ''): Promise<AppendResult | UpdateResult> => {
  await ensureSheetExists("TodaysWorkout", ["Date", "WorkoutData", "Completed", "Notes"]);
  
  // Get the current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch all workouts
  const allWorkouts = await fetchData("TodaysWorkout!A2:D");
  const index = allWorkouts.findIndex(row => row[0] === today);
  
  // Format the workout data
  const workoutRow = [
    today,
    JSON.stringify(workoutData),
    completed.toString(),
    notes
  ];
  
  if (index !== -1) {
    // Update existing workout
    return updateData(`TodaysWorkout!A${index + 2}:D${index + 2}`, [workoutRow]);
  } else {
    // Create a new workout if none exists for today
    return appendData("TodaysWorkout", workoutRow);
  }
};

// Mark a workout as completed
export const completeWorkout = async (notes: string = ''): Promise<UpdateResult | null> => {
  const todaysWorkout = await fetchTodaysWorkout();
  
  if (todaysWorkout) {
    const allWorkouts = await fetchData("TodaysWorkout!A2:D");
    const index = allWorkouts.findIndex(row => row[0] === new Date().toISOString().split('T')[0]);
    
    if (index !== -1) {
      const updatedWorkout = [
        todaysWorkout.date,
        JSON.stringify(todaysWorkout.workoutData),
        'true',
        notes || todaysWorkout.notes
      ];
      
      return updateData(`TodaysWorkout!A${index + 2}:D${index + 2}`, [updatedWorkout]);
    }
  }
  
  return null; // No workout found for today
};