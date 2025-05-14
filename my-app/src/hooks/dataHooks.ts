import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Custom hook for accessing workout templates from the global context
 * @param options - Optional configuration
 * @returns Data and loading state for workout templates
 */
export function useWorkoutTemplates(options: { forceRefresh?: boolean } = {}) {
  const { state, fetchWorkoutTemplates } = useAppContext();
  const { forceRefresh = false } = options;
  
  useEffect(() => {
    if (forceRefresh) {
      fetchWorkoutTemplates(true);
    }
  }, [forceRefresh, fetchWorkoutTemplates]);
  
  return {
    data: state.workoutTemplates,
    isLoading: state.loading.templates,
    error: null,
    refreshData: () => fetchWorkoutTemplates(true)
  };
}

/**
 * Custom hook for accessing the exercise library from the global context
 * @param options - Optional configuration
 * @returns Data and loading state for exercises
 */
export function useExerciseLibrary(options: { forceRefresh?: boolean } = {}) {
  const { state, fetchExercises } = useAppContext();
  const { forceRefresh = false } = options;
  
  useEffect(() => {
    if (forceRefresh) {
      fetchExercises(true);
    }
  }, [forceRefresh, fetchExercises]);
  
  return {
    data: state.exercises,
    isLoading: state.loading.exercises,
    error: null,
    refreshData: () => fetchExercises(true)
  };
}

/**
 * Custom hook for accessing workout logs from the global context
 * @param options - Optional configuration
 * @returns Data and loading state for workout logs
 */
export function useWorkoutLogs(options: { forceRefresh?: boolean } = {}) {
  const { state, fetchWorkoutLogs } = useAppContext();
  const { forceRefresh = false } = options;
  
  useEffect(() => {
    if (forceRefresh) {
      fetchWorkoutLogs(true);
    }
  }, [forceRefresh, fetchWorkoutLogs]);
  
  return {
    data: state.workoutLogs,
    isLoading: state.loading.logs,
    error: null,
    refreshData: () => fetchWorkoutLogs(true)
  };
}

/**
 * Custom hook for accessing to-do items from the global context
 * @param options - Optional configuration
 * @returns Data and loading state for todos
 */
export function useTodos(options: { forceRefresh?: boolean } = {}) {
  const { state, fetchTodos } = useAppContext();
  const { forceRefresh = false } = options;
  
  useEffect(() => {
    if (forceRefresh) {
      fetchTodos(true);
    }
  }, [forceRefresh, fetchTodos]);
  
  return {
    data: state.todos,
    isLoading: state.loading.todos,
    error: null,
    refreshData: () => fetchTodos(true)
  };
}

/**
 * Custom hook for accessing body measurements from the global context
 * @param options - Optional configuration
 * @returns Data and loading state for body measurements
 */
export function useBodyMeasurements(options: { forceRefresh?: boolean } = {}) {
  const { state, fetchBodyMeasurements } = useAppContext();
  const { forceRefresh = false } = options;
  
  useEffect(() => {
    if (forceRefresh) {
      fetchBodyMeasurements(true);
    }
  }, [forceRefresh, fetchBodyMeasurements]);
  
  return {
    data: state.measurementLogs,
    isLoading: state.loading.measurements,
    error: null,
    refreshData: () => fetchBodyMeasurements(true)
  };
}

/**
 * Custom hook for accessing filtered workout logs
 * @param filters - Filter criteria for workout logs
 * @param options - Optional configuration
 * @returns Filtered data and loading state
 */
export function useFilteredWorkoutLogs(
  filters: { 
    startDate?: Date | null; 
    endDate?: Date | null; 
    muscleGroup?: string; 
    exercise?: string; 
  } = {},
  options: { forceRefresh?: boolean } = {}
) {
  const { state, fetchWorkoutLogs } = useAppContext();
  const { forceRefresh = false } = options;
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  useEffect(() => {
    if (forceRefresh) {
      fetchWorkoutLogs(true);
    }
  }, [forceRefresh, fetchWorkoutLogs]);
  
  // Filter the data whenever the logs or filters change
  useEffect(() => {
    if (!state.workoutLogs.length) {
      setFilteredData([]);
      return;
    }
    
    const filtered = state.workoutLogs.filter(log => {
      // Filter by date range
      if (filters.startDate && new Date(log[0]) < filters.startDate) {
        return false;
      }
      if (filters.endDate && new Date(log[0]) > filters.endDate) {
        return false;
      }
      
      // Filter by muscle group
      if (filters.muscleGroup && !log[1]?.toLowerCase().includes(filters.muscleGroup.toLowerCase())) {
        return false;
      }
      
      // Filter by exercise
      if (filters.exercise && !log[2]?.toLowerCase().includes(filters.exercise.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setFilteredData(filtered);
  }, [state.workoutLogs, filters]);
  
  return {
    data: filteredData,
    isLoading: state.loading.logs,
    error: null,
    refreshData: () => fetchWorkoutLogs(true)
  };
}

/**
 * Custom hook for accessing exercises by muscle group
 * @param muscleGroup - Muscle group to filter by
 * @param options - Optional configuration
 * @returns Filtered data and loading state
 */
export function useExercisesByMuscleGroup(
  muscleGroup: string, 
  options: { forceRefresh?: boolean } = {}
) {
  const { state, fetchExercises } = useAppContext();
  const { forceRefresh = false } = options;
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  useEffect(() => {
    if (forceRefresh) {
      fetchExercises(true);
    }
  }, [forceRefresh, fetchExercises]);
  
  // Filter the data whenever the exercises or muscle group changes
  useEffect(() => {
    if (!state.exercises.length || !muscleGroup) {
      setFilteredData([]);
      return;
    }
    
    const filtered = state.exercises.filter(exercise => 
      exercise.muscleGroup?.toLowerCase() === muscleGroup.toLowerCase()
    );
    
    setFilteredData(filtered);
  }, [state.exercises, muscleGroup]);
  
  return {
    data: filteredData,
    isLoading: state.loading.exercises,
    error: null,
    refreshData: () => fetchExercises(true)
  };
}

/**
 * Custom hook for accessing today's workout
 * This is a placeholder until you implement this in the global context
 */
export function useTodaysWorkout(options: { forceRefresh?: boolean } = {}) {
  // Note: This will need to be implemented in the AppContext
  const { state } = useAppContext();
  
  return {
    data: null, // Replace with actual data once implemented in context
    isLoading: false,
    error: null,
    refreshData: () => Promise.resolve()
  };
}