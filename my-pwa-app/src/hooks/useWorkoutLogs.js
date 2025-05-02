import { useState, useEffect, useCallback } from 'react';
import { useSheetData, useOnlineStatus } from '../utils/dataFetcher';
import { 
  cacheData, 
  updateData, 
  clearSheet, 
  appendData 
} from '../utils/sheetsApi';
import config from '../config';
import { debounce } from '../utils/helpers';

const { SPREADSHEET_ID } = config.google;

// Custom hook for efficient workout data management
export const useWorkoutLogs = (initialLogs = [], onLogAdded = null) => {
  const [logs, setLogs] = useState(initialLogs);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    muscleGroup: '',
    exercise: '',
  });
  const [loading, setLoading] = useState(false);
  const isOnline = useOnlineStatus();
  
  // Use our new data fetching hook
  const { 
    data: fetchedLogs, 
    isLoading: isFetching, 
    revalidate,
    mutate
  } = useSheetData(
    'Workout_Logs!A2:F', 
    '/api/workout', 
    row => row,
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
  }, [initialLogs]);
  
  // Update logs from fetched data
  useEffect(() => {
    if (fetchedLogs && fetchedLogs.length > 0) {
      setLogs(fetchedLogs);
      applyFilters(fetchedLogs, filters);
    }
  }, [fetchedLogs]);
  
  // Apply filters to workout logs
  const applyFilters = useCallback((logsToFilter, currentFilters) => {
    let result = [...logsToFilter];
    
    if (currentFilters.startDate) {
      result = result.filter(log => {
        if (!log[0]) return false;
        const [day, month, year] = log[0].split('/');
        const logDate = new Date(`${year}-${month}-${day}`);
        return logDate >= currentFilters.startDate;
      });
    }
    
    if (currentFilters.endDate) {
      result = result.filter(log => {
        if (!log[0]) return false;
        const [day, month, year] = log[0].split('/');
        const logDate = new Date(`${year}-${month}-${day}`);
        return logDate <= currentFilters.endDate;
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
  
  // Update filters and apply them
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(logs, updatedFilters);
  }, [logs, filters, applyFilters]);
  
  // Add new log
  const addLog = useCallback(async (newLog) => {
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
  const editLog = useCallback(async (updatedLog, index) => {
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
  const deleteLog = useCallback(async (index) => {
    setLoading(true);
    try {
      // Optimistically update the UI
      const updatedLogs = logs.filter((_, i) => i !== index);
      setLogs(updatedLogs);
      applyFilters(updatedLogs, filters);
      
      // Update the API and cache
      if (isOnline) {
        // Clear the specified row
        await clearSheet(`Workout_Logs!A${index + 2}:F${index + 2}`);
        
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
  
  // Force refresh the data
  const refreshLogs = useCallback(debounce(() => {
    revalidate(true); // Skip cache
  }, 300), [revalidate]);
  
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