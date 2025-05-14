import { openDB, IDBPDatabase } from 'idb';

interface SyncQueueItem {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  retries: number;
}

// Database structure
const DB_NAME = 'workout-log-pwa';
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = 'sync-queue';
const WORKOUT_DATA_STORE = 'workout-data';
const SETTINGS_STORE = 'settings';

// Initialize IndexedDB
async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(WORKOUT_DATA_STORE)) {
        const workoutStore = db.createObjectStore(WORKOUT_DATA_STORE, { keyPath: 'id' });
        workoutStore.createIndex('type', 'type');
        workoutStore.createIndex('date', 'date');
      }
      
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    }
  });
}

// Add an API request to the sync queue when offline
export async function queueAPIRequest(
  endpoint: string,
  method: string,
  body: unknown,
  headers: Record<string, string>
): Promise<string> {
  const db = await getDB();
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const queueItem: SyncQueueItem = {
    id,
    timestamp: Date.now(),
    endpoint,
    method,
    body,
    headers,
    retries: 0
  };
  
  await db.add(SYNC_QUEUE_STORE, queueItem);
  return id;
}

// Process the sync queue when back online
export async function processSyncQueue(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(SYNC_QUEUE_STORE);
  const items = await store.getAll();
  
  for (const item of items) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: item.headers,
        body: item.method !== 'GET' ? JSON.stringify(item.body) : undefined,
      });
      
      if (response.ok) {
        // If successful, remove from queue
        await store.delete(item.id);
      } else {
        // If failed, increment retry count
        item.retries += 1;
        if (item.retries < 5) {
          await store.put(item);
        } else {
          // If too many retries, remove from queue
          await store.delete(item.id);
          console.error(`Failed to sync ${item.endpoint} after 5 retries`);
        }
      }
    } catch (error) {
      console.error(`Error processing sync queue item:`, error);
    }
  }
  
  await tx.done;
}

// Define a type for workout data
interface WorkoutData {
  id?: string;
  [key: string]: unknown;
}

// Save workout data to IndexedDB for offline access
export async function saveWorkoutData(data: WorkoutData): Promise<string> {
  const db = await getDB();
  // Ensure the data has an ID
  if (!data.id) {
    data.id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  await db.put(WORKOUT_DATA_STORE, data);
  return data.id;
}

// Retrieve workout data from IndexedDB
export async function getWorkoutData(id: string): Promise<WorkoutData | null> {
  const db = await getDB();
  return db.get(WORKOUT_DATA_STORE, id);
}

// Get all workout data by type
export async function getAllWorkoutData(type: string): Promise<WorkoutData[]> {
  const db = await getDB();
  const tx = db.transaction(WORKOUT_DATA_STORE, 'readonly');
  const index = tx.store.index('type');
  return index.getAll(type);
}

// Save application settings
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, { key, value });
}

// Get application settings
export async function getSetting(key: string): Promise<unknown | null> {
  const db = await getDB();
  const result = await db.get(SETTINGS_STORE, key);
  return result ? result.value : null;
}

// Register online/offline event listeners
export function registerNetworkListeners(): void {
  window.addEventListener('online', async () => {
    console.log('App is online. Processing sync queue...');
    await processSyncQueue();
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline. Requests will be queued for later.');
  });
}

// Check if the app is installed as PWA
export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as unknown as {standalone?: boolean}).standalone === true;
}

// Check if the browser supports service workers
export function supportsServiceWorker(): boolean {
  return 'serviceWorker' in navigator;
}

// Handle development mode service worker issues
export async function handleServiceWorkerDev(): Promise<void> {
  // Only run in development mode
  if (import.meta.env.DEV && supportsServiceWorker()) {
    try {
      // Check if we have any existing service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // If we have more than one registration, unregister all of them to prevent conflicts
      if (registrations.length > 1) {
        console.log('Multiple service workers found, cleaning up...');
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered service worker for scope:', registration.scope);
        }
        
        // Reload to ensure clean state
        window.location.reload();
        return;
      }
      
      // Check for the dev service worker specifically
      const activeDevSw = registrations.find(r => r.active && r.active.scriptURL.includes('dev-sw.js'));
      
      // If we don't have the dev service worker active, but have a different one, clean up
      if (!activeDevSw && registrations.length > 0) {
        console.log('Cleaning up non-development service worker');
        await Promise.all(registrations.map(r => r.unregister()));
        window.location.reload();
      }
    } catch (error) {
      console.warn('Error handling development service worker:', error);
    }
  }
}
