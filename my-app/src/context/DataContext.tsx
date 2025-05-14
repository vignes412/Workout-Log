import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { fetchWorkoutTemplates, fetchTodos, fetchData } from '../utils/sheetsApi';
import { WorkoutTemplate, Todo, Measurement, CompletedWorkout } from '../types';
import { deepClone } from '../utils/helpers';

interface DataState {
  templates: WorkoutTemplate[];
  todos: Todo[];
  measurements: Measurement[];
  workoutLogs: CompletedWorkout[];
  lastFetched: {
    templates: number | null;
    todos: number | null;
    measurements: number | null;
    workoutLogs: number | null;
  };
  isLoading: {
    templates: boolean;
    todos: boolean;
    measurements: boolean;
    workoutLogs: boolean;
  };
}

const initialState: DataState = {
  templates: [],
  todos: [],
  measurements: [],
  workoutLogs: [],
  lastFetched: {
    templates: null,
    todos: null,
    measurements: null,
    workoutLogs: null
  },
  isLoading: {
    templates: false,
    todos: false,
    measurements: false,
    workoutLogs: false
  }
};

type DataAction =
  | { type: 'SET_TEMPLATES'; payload: WorkoutTemplate[] }
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'SET_MEASUREMENTS'; payload: Measurement[] }
  | { type: 'SET_WORKOUT_LOGS'; payload: CompletedWorkout[] }
  | { type: 'SET_LOADING'; payload: { key: keyof DataState['isLoading']; value: boolean } }
  | { type: 'SET_LAST_FETCHED'; payload: { key: keyof DataState['lastFetched']; value: number } };

const dataReducer = (state: DataState, action: DataAction): DataState => {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'SET_TODOS':
      return { ...state, todos: action.payload };
    case 'SET_MEASUREMENTS':
      return { ...state, measurements: action.payload };
    case 'SET_WORKOUT_LOGS':
      return { ...state, workoutLogs: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: {
          ...state.isLoading,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_LAST_FETCHED':
      return {
        ...state,
        lastFetched: {
          ...state.lastFetched,
          [action.payload.key]: action.payload.value
        }
      };
    default:
      return state;
  }
};

// Cache duration in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface DataContextType {
  state: DataState;
  fetchTemplates: (accessToken: string, force?: boolean) => Promise<WorkoutTemplate[]>;
  fetchTodoList: (accessToken: string, force?: boolean) => Promise<Todo[]>;
  fetchMeasurements: (accessToken: string, force?: boolean) => Promise<Measurement[]>;
  fetchWorkoutLogs: (accessToken: string, force?: boolean) => Promise<CompletedWorkout[]>;
}

const DataContext = createContext<DataContextType | null>(null);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const fetchTemplates = useCallback(async (accessToken: string, force = false): Promise<WorkoutTemplate[]> => {
    const now = Date.now();
    const { templates: currentTemplates, lastFetched } = state;
    
    if (!force && lastFetched.templates && (now - lastFetched.templates < CACHE_TTL)) {
      return currentTemplates;
    }
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'templates', value: true } });
    
    try {
      const templatesResponse = await fetchWorkoutTemplates();
      if (!templatesResponse.success) {
        throw new Error('Failed to fetch templates');
      }
      
      const templates = templatesResponse.data || [];
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
      dispatch({ type: 'SET_LAST_FETCHED', payload: { key: 'templates', value: now } });
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      return currentTemplates;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'templates', value: false } });
    }
  }, [state]);

  const fetchTodoList = useCallback(async (accessToken: string, force = false): Promise<Todo[]> => {
    const now = Date.now();
    const { todos: currentTodos, lastFetched } = state;
    
    if (!force && lastFetched.todos && (now - lastFetched.todos < CACHE_TTL)) {
      return currentTodos;
    }
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: true } });
    
    try {
      const todosResponse = await fetchTodos();
      if (!todosResponse.success) {
        throw new Error('Failed to fetch todos');
      }
      
      const todos = todosResponse.data || [];
      dispatch({ type: 'SET_TODOS', payload: todos });
      dispatch({ type: 'SET_LAST_FETCHED', payload: { key: 'todos', value: now } });
      return todos;
    } catch (error) {
      console.error('Error fetching todos:', error);
      return currentTodos;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'todos', value: false } });
    }
  }, [state]);

  const fetchMeasurements = useCallback(async (accessToken: string, force = false): Promise<Measurement[]> => {
    const now = Date.now();
    const { measurements: currentMeasurements, lastFetched } = state;
    
    if (!force && lastFetched.measurements && (now - lastFetched.measurements < CACHE_TTL)) {
      return currentMeasurements;
    }
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'measurements', value: true } });
    
    try {
      const measurementsResponse = await fetchData<Measurement>(
        'Measurements!A2:L',
        '/api/measurements',
        (row: any[]) => ({
          date: row[0],
          weight: parseFloat(row[1]) || 0,
          chest: parseFloat(row[2]) || 0,
          waist: parseFloat(row[3]) || 0,
          hips: parseFloat(row[4]) || 0,
          rightArm: parseFloat(row[5]) || 0,
          leftArm: parseFloat(row[6]) || 0,
          rightThigh: parseFloat(row[7]) || 0,
          leftThigh: parseFloat(row[8]) || 0,
          rightCalf: parseFloat(row[9]) || 0,
          leftCalf: parseFloat(row[10]) || 0,
          notes: row[11] || ''
        })
      );
      
      if (!measurementsResponse.success) {
        throw new Error('Failed to fetch measurements');
      }
      
      const measurements = measurementsResponse.data || [];
      dispatch({ type: 'SET_MEASUREMENTS', payload: measurements as Measurement[] });
      dispatch({ type: 'SET_LAST_FETCHED', payload: { key: 'measurements', value: now } });
      return measurements as Measurement[];
    } catch (error) {
      console.error('Error fetching measurements:', error);
      return currentMeasurements;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'measurements', value: false } });
    }
  }, [state]);

  const fetchWorkoutLogs = useCallback(async (accessToken: string, force = false): Promise<CompletedWorkout[]> => {
    const now = Date.now();
    const { workoutLogs: currentWorkoutLogs, lastFetched } = state;
    
    if (!force && lastFetched.workoutLogs && (now - lastFetched.workoutLogs < CACHE_TTL)) {
      return currentWorkoutLogs;
    }
    
    dispatch({ type: 'SET_LOADING', payload: { key: 'workoutLogs', value: true } });
    
    try {
      const logsResponse = await fetchData<CompletedWorkout>(
        'CompletedWorkouts!A2:F',
        '/api/workoutLogs',
        (row: any[]) => ({
          date: row[0],
          templateName: row[1],
          exercises: JSON.parse(row[2] || '[]'),
          duration: parseInt(row[3]) || 0,
          notes: row[4] || '',
        })
      );
      
      if (!logsResponse.success) {
        throw new Error('Failed to fetch workout logs');
      }
      
      const logs = logsResponse.data || [];
      dispatch({ type: 'SET_WORKOUT_LOGS', payload: logs as CompletedWorkout[] });
      dispatch({ type: 'SET_LAST_FETCHED', payload: { key: 'workoutLogs', value: now } });
      return logs as CompletedWorkout[];
    } catch (error) {
      console.error('Error fetching workout logs:', error);
      return currentWorkoutLogs;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'workoutLogs', value: false } });
    }
  }, [state]);

  const contextValue = useMemo(() => ({
    state,
    fetchTemplates,
    fetchTodoList,
    fetchMeasurements,
    fetchWorkoutLogs
  }), [
    state,
    fetchTemplates,
    fetchTodoList,
    fetchMeasurements,
    fetchWorkoutLogs
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};