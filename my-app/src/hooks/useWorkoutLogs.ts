/// <reference path="../types/gapi.d.ts" />
import { useState, useEffect, useCallback } from 'react';
import { 
  cacheData, 
  updateData, 
  deleteData, 
  appendData,
  useOnlineStatus 
} from '../utils/sheetsApi';
import config from '../config';
import { debounce } from '../utils/helpers';

// Custom hook to simulate useSheetData functionality
const useSheetData = <T>(
  range: string,
  cacheKey: string,
  mapFn: (row: any) => any,
  options: {
    initialFetch?: boolean;
    onSuccess?: (data: T) => void;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(options.initialFetch !== false);
  const isOnline = useOnlineStatus();

  // Initial fetch
  useEffect(() => {
    if (options.initialFetch !== false) {
      fetchData();
    }
  }, []);

  // Fetch function
  const fetchData = async (skipCache = false) => {
    setIsLoading(true);
    try {
      if (!isOnline) {
        // Load from cache if offline
        const cachedData = await caches.open(config.cache.DATA_CACHE_NAME);
        const response = await cachedData.match(cacheKey);
        if (response) {
          const data = await response.json();
          setData(data as T);
          if (options.onSuccess) options.onSuccess(data as T);
        }
      } else {
        // Fetch from API - use type assertion for window.gapi
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: config.google.SPREADSHEET_ID,
          range: range
        });
        
        let responseData = response.result.values || [];
        if (mapFn) {
          responseData = responseData.map(mapFn);
        }
        
        setData(responseData as T);
        if (options.onSuccess) options.onSuccess(responseData as T);
        
        // Cache the result
        await cacheData(cacheKey, responseData);
      }
    } catch (error) {
      console.error('Error in useSheetData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    revalidate: fetchData
  };
};

const { SPREADSHEET_ID } = config.google;

export type WorkoutLog = [
  date: string,
  muscleGroup: string,
  exercise: string,
  reps: string,
  weight: string,
  rating: string,
  restTime?: string
];

export interface WorkoutFilters {
  startDate: Date | null;
  endDate: Date | null;
  muscleGroup: string;
  exercise: string;
}

interface UseWorkoutLogsReturn {
  logs: WorkoutLog[];
  allLogs: WorkoutLog[];
  filters: WorkoutFilters;
  updateFilters: (newFilters: Partial<WorkoutFilters>) => void;
  addLog: (newLog: WorkoutLog) => Promise<boolean>;
  editLog: (updatedLog: WorkoutLog, index: number) => Promise<boolean>;
  deleteLog: (index: number) => Promise<boolean>;
  refreshLogs: () => void;
  isLoading: boolean;
  isOnline: boolean;
}

// Custom hook for efficient workout data management
export const useWorkoutLogs = (
  initialLogs: WorkoutLog[] = [], 
  onLogAdded: ((log: WorkoutLog) => void) | null = null
): UseWorkoutLogsReturn => {
  const [logs, setLogs] = useState<WorkoutLog[]>(initialLogs);
  const [filteredLogs, setFilteredLogs] = useState<WorkoutLog[]>([]);
  const [filters, setFilters] = useState<WorkoutFilters>({
    startDate: null,
    endDate: null,
    muscleGroup: '',
    exercise: '',
  });
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();
  
  // Apply filters to workout logs - memoized to prevent recreating function on each render
  const applyFilters = useCallback((logsToFilter: WorkoutLog[], currentFilters: WorkoutFilters) => {
    let result = [...logsToFilter];
    
    if (currentFilters.startDate) {
      result = result.filter(log => {
        if (!log[0]) return false;
        const [day, month, year] = log[0].split('/');
        const logDate = new Date(`${year}-${month}-${day}`);
        // Add non-null assertion or type guard to handle null case
        return logDate >= (currentFilters.startDate as Date);
      });
    }
    
    if (currentFilters.endDate) {
      result = result.filter(log => {
        if (!log[0]) return false;
        const [day, month, year] = log[0].split('/');
        const logDate = new Date(`${year}-${month}-${day}`);
        // Add non-null assertion or type guard to handle null case
        return logDate <= (currentFilters.endDate as Date);
      });
    }
    
    if (currentFilters.muscleGroup) {
      result = result.filter(log => 
        log[1] && log[1].toLowerCase().includes(currentFilters.muscleGroup.toLowerCase())
      );
    }
    
    if (currentFilters.exercise) {
      result = result.filter(log => 
        log[2] && log[2].toLowerCase().includes(currentFilters.exercise.toLowerCase())
      );
    }
    
    setFilteredLogs(result);
  }, []);
  
  // Use our data fetching hook
  const { 
    data: fetchedLogs, 
    isLoading: isFetching, 
    revalidate,
  } = useSheetData<WorkoutLog[]>(
    'Workout_Logs!A2:F', 
    '/api/workout', 
    row => row as WorkoutLog,
    {
      initialFetch: !initialLogs || initialLogs.length === 0,
      onSuccess: (data) => {
        setLogs(data);
        applyFilters(data, filters);
      }
    }
  );
  
  // Update logs from props when they change
  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
      applyFilters(initialLogs, filters);
    }
  }, [initialLogs, applyFilters, filters]);
  
  // Update logs from fetched data
  useEffect(() => {
    if (fetchedLogs && fetchedLogs.length > 0) {
      setLogs(fetchedLogs);
      applyFilters(fetchedLogs, filters);
    }
  }, [fetchedLogs, applyFilters, filters]);
  
  // Update filters and apply them
  const updateFilters = useCallback((newFilters: Partial<WorkoutFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(logs, updatedFilters);
  }, [logs, filters, applyFilters]);
  
  // Add new log
  const addLog = useCallback(async (newLog: WorkoutLog): Promise<boolean> => {
    setLoading(true);
    try {
      // Optimistically update the UI
      const updatedLogs = [...logs, newLog];
      setLogs(updatedLogs);
      applyFilters(updatedLogs, filters);
      
      // Update the API and cache
      if (isOnline) {
        await appendData('Workout_Logs!A:F', [newLog]);
        // Update the cache
        await cacheData('/api/workout', updatedLogs);
        
        // Call onLogAdded callback if provided
        if (onLogAdded) onLogAdded(newLog);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding log:', error);
      // Revert optimistic update
      applyFilters(logs, filters);
      return false;
    } finally {
      setLoading(false);
    }
  }, [logs, filters, applyFilters, isOnline, onLogAdded]);
  
  // Edit existing log
  const editLog = useCallback(async (updatedLog: WorkoutLog, index: number): Promise<boolean> => {
    setLoading(true);
    try {
      // Optimistically update the UI
      const updatedLogs = [...logs];
      updatedLogs[index] = updatedLog;
      setLogs(updatedLogs);
      applyFilters(updatedLogs, filters);
      
      // Update the API and cache
      if (isOnline) {
        const range = `Workout_Logs!A${index + 2}:F${index + 2}`;
        await updateData(range, [updatedLog]);
        // Update the cache
        await cacheData('/api/workout', updatedLogs);
      }
      
      return true;
    } catch (error) {
      console.error('Error editing log:', error);
      // Revert optimistic update
      applyFilters(logs, filters);
      return false;
    } finally {
      setLoading(false);
    }
  }, [logs, filters, applyFilters, isOnline]);
  
  // Delete log
  const deleteLog = useCallback(async (index: number): Promise<boolean> => {
    setLoading(true);
    try {
      // Optimistically update the UI
      const updatedLogs = logs.filter((_, i) => i !== index);
      setLogs(updatedLogs);
      applyFilters(updatedLogs, filters);
      
      // Update the API and cache
      if (isOnline) {
        // Clear the specified row
        await deleteData(`Workout_Logs!A${index + 2}:F${index + 2}`);
        
        // Get remaining data after the deleted row
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `Workout_Logs!A${index + 3}:F`,
        });
        
        const remainingData = response.result.values || [];
        
        // Shift remaining data up
        if (remainingData.length > 0) {
          await updateData(`Workout_Logs!A${index + 2}:F`, remainingData);
        }
        
        // Update the cache
        await cacheData('/api/workout', updatedLogs);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting log:', error);
      // Revert optimistic update
      applyFilters(logs, filters);
      return false;
    } finally {
      setLoading(false);
    }
  }, [logs, filters, applyFilters, isOnline]);
  
  // Force refresh the data - debounced to prevent multiple rapid calls
  const refreshLogs = useCallback(() => {
    debounce(() => {
      revalidate(true); // Skip cache
    }, 300)();
  }, [revalidate]);
  
  return {
    logs: filteredLogs,
    allLogs: logs,
    filters,
    updateFilters,
    addLog,
    editLog,
    deleteLog,
    refreshLogs,
    isLoading: loading || isFetching,
    isOnline
  };
};

export default useWorkoutLogs;