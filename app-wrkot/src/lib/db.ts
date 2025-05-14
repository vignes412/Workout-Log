import { openDB, IDBPDatabase } from 'idb';

// Define TypeScript interfaces for our data models
export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // ISO date string
  name: string;
  exercises: Exercise[];
  notes?: string;
  duration?: number; // in minutes
  isCompleted: boolean;
  lastModified: number; // timestamp
  isSynced: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  weight?: number;
  reps?: number;
  duration?: number; // in seconds
  distance?: number; // in meters
  isCompleted: boolean;
}

// Database configuration
const DB_NAME = 'workout-pwa-db';
const DB_VERSION = 1;
const STORES = {
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  USER_SETTINGS: 'userSettings'
};

// Initialize the database
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create workouts store
        if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
          const workoutStore = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
          workoutStore.createIndex('userId', 'userId');
          workoutStore.createIndex('date', 'date');
          workoutStore.createIndex('isSynced', 'isSynced');
        }
        
        // Create exercises template store
        if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
          const exerciseStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
          exerciseStore.createIndex('userId', 'userId');
          exerciseStore.createIndex('category', 'category');
        }
        
        // Create user settings store
        if (!db.objectStoreNames.contains(STORES.USER_SETTINGS)) {
          db.createObjectStore(STORES.USER_SETTINGS, { keyPath: 'key' });
        }
      }
    });
  }
  return dbPromise;
}

// Workout data functions
export async function saveWorkout(workout: WorkoutSession): Promise<string> {
  const db = await getDB();
  
  // Ensure the workout has an ID and timestamp
  if (!workout.id) {
    workout.id = `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  workout.lastModified = Date.now();
  
  await db.put(STORES.WORKOUTS, workout);
  return workout.id;
}

export async function getWorkout(id: string): Promise<WorkoutSession | undefined> {
  const db = await getDB();
  return db.get(STORES.WORKOUTS, id);
}

export async function getWorkouts(userId: string, options: { limit?: number, offset?: number } = {}): Promise<WorkoutSession[]> {
  const { limit, offset = 0 } = options;
  const db = await getDB();
  const tx = db.transaction(STORES.WORKOUTS, 'readonly');
  const index = tx.store.index('userId');
  
  let cursor = await index.openCursor(userId);
  const results: WorkoutSession[] = [];
  
  let counter = 0;
  while (cursor && (limit === undefined || counter < limit + offset)) {
    if (counter >= offset) {
      results.push(cursor.value);
    }
    counter++;
    cursor = await cursor.continue();
  }
  
  return results;
}

export async function deleteWorkout(id: string): Promise<boolean> {
  const db = await getDB();
  await db.delete(STORES.WORKOUTS, id);
  return true;
}

export async function getUnsyncedWorkouts(userId: string): Promise<WorkoutSession[]> {
  const db = await getDB();
  const tx = db.transaction(STORES.WORKOUTS, 'readonly');
  const index = tx.store.index('isSynced');
  return index.getAll(false);
}

export async function markWorkoutSynced(id: string): Promise<void> {
  const db = await getDB();
  const workout = await db.get(STORES.WORKOUTS, id);
  if (workout) {
    workout.isSynced = true;
    await db.put(STORES.WORKOUTS, workout);
  }
}

// User settings functions
export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(STORES.USER_SETTINGS, { key, value });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const result = await db.get(STORES.USER_SETTINGS, key);
  return result?.value;
}

// Clear all data (for logout)
export async function clearAllUserData(userId: string): Promise<void> {
  const db = await getDB();
  
  // Delete user's workouts
  const workoutTx = db.transaction(STORES.WORKOUTS, 'readwrite');
  const userIdIndex = workoutTx.store.index('userId');
  let cursor = await userIdIndex.openCursor(userId);
  
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  
  // Delete user's exercise templates
  const exerciseTx = db.transaction(STORES.EXERCISES, 'readwrite');
  const exerciseUserIdIndex = exerciseTx.store.index('userId');
  let exerciseCursor = await exerciseUserIdIndex.openCursor(userId);
  
  while (exerciseCursor) {
    await exerciseCursor.delete();
    exerciseCursor = await exerciseCursor.continue();
  }
}

// Initialize database on module load
getDB().catch(err => console.error('Failed to initialize database:', err));
