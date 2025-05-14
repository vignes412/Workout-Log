import { format, addDays, parseISO, isValid, formatDistance } from 'date-fns';

/**
 * Returns today's date in ISO format (YYYY-MM-DD)
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Formats a date object or string with an optional format pattern
 * @param date - The date to format
 * @param formatPattern - Optional format pattern (e.g., 'MMM d')
 * @returns - The formatted date string
 */
export const formatDate = (date: Date | string, formatPattern?: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (formatPattern) {
    // Handle custom formats
    if (formatPattern === 'MMM d') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    }
    
    // Add more format patterns as needed
  }
  
  // Default format DD/MM/YYYY
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parses a date string in DD/MM/YYYY format to a Date object
 * @param dateString - The date string to parse
 * @returns - The parsed Date object
 */
export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

/**
 * Formats time in seconds to MM:SS format
 * @param seconds Time in seconds
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Returns a relative time description (e.g. "2 days ago")
 * @param dateString ISO date string
 */
export const getRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};

/**
 * Debounce function to limit the rate at which a function can fire
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns - The debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      if (timeout) clearTimeout(timeout);
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Creates a memoized version of a function
 * @param fn - The function to memoize
 * @returns - The memoized function
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): ((...args: Parameters<T>) => ReturnType<T>) => {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 * @param func - The function to throttle
 * @param limit - The time limit in milliseconds
 * @returns - The throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Calculate overall workout progress as a percentage
 * @param workout The workout data
 */
export const calculateWorkoutProgress = (workout: any): number => {
  if (!workout?.workoutData?.exercises) return 0;
  
  const exercises = workout.workoutData.exercises;
  let totalSets = 0;
  let completedSets = 0;
  
  exercises.forEach((exercise: any) => {
    totalSets += exercise.sets;
    completedSets += exercise.setsCompleted || 0;
  });
  
  return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
};

/**
 * Check if a workout is complete (all sets of all exercises done)
 * @param workout The workout data 
 */
export const isWorkoutComplete = (workout: any): boolean => {
  if (!workout?.workoutData?.exercises) return false;
  
  return workout.workoutData.exercises.every((exercise: any) => {
    if (exercise.setsCompleted === undefined || exercise.setsCompleted === null) return false;
    return exercise.setsCompleted >= exercise.sets;
  });
};

/**
 * Calculate the volume (sets * reps * weight) for a specific exercise
 * @param sets Number of sets
 * @param reps Number of reps
 * @param weight Weight used
 */
export const calculateVolume = (sets: number, reps: number, weight: number): number => {
  return sets * reps * weight;
};

/**
 * Parse a numeric value safely, returning 0 for invalid values
 * @param value The value to parse
 */
export const parseNumeric = (value: any): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get unique values from an array
 * @param array The array to get unique values from
 */
export const getUniqueValues = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * Sort an array of objects by a specific property
 * @param array The array to sort
 * @param property The property to sort by
 * @param direction The sort direction ('asc' or 'desc')
 */
export const sortByProperty = <T>(
  array: T[], 
  property: keyof T, 
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const valueA = a[property];
    const valueB = b[property];
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Groups an array by a key selector function
 * @param array - The array to group
 * @param keySelector - Function that returns the key to group by
 * @returns - An object with keys from keySelector and arrays as values
 */
export const groupBy = <T, K extends string | number | symbol>(array: T[], keySelector: (item: T) => K): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const key = keySelector(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
};

/**
 * Flattens a nested array structure
 * @param array - The array to flatten
 * @returns - The flattened array
 */
export const flatten = <T>(array: (T | T[])[]): T[] => {
  return array.reduce<T[]>(
    (result, item) => result.concat(Array.isArray(item) ? flatten(item) : item),
    []
  );
};

/**
 * Generates a unique ID
 * @returns - A unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Deep clones an object
 * @param obj - The object to clone
 * @returns - The cloned object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const cloned = {} as Record<string, any>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, any>)[key]);
    }
  }
  
  return cloned as T;
};