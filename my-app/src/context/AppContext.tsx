import React, { createContext, useContext, useReducer, useMemo, useCallback, ReactNode, useEffect, useState } from 'react';
import { getAccessToken } from '../services/authService';
import { WorkoutTemplate, Todo, Measurement, UserSettings, Exercise, WorkoutLog } from '../types';
import DataService from '../services/DataService';

type AppState = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  isOffline: boolean;
  currentPage: string;
  isDrawerOpen: boolean; 
  themeMode: 'light' | 'dark';
  userSettings: UserSettings;
  workoutTemplates: WorkoutTemplate[];
  measurementLogs: Measurement[];
  todos: Todo[];
  workoutLogs: any[];
  exercises: Exercise[];
  loading: {
    templates: boolean;
    measurements: boolean;
    todos: boolean;
    logs: boolean;
    exercises: boolean;
  };
  lastFetched: {
    templates: number | null;
    measurements: number | null;
    todos: number | null;
    logs: number | null;
    exercises: number | null;
  };
};

const initialState: AppState = {
  accessToken: null,
  isAuthenticated: false,
  isDarkMode: localStorage.getItem('theme') === 'dark',
  isOffline: !navigator.onLine,
  currentPage: 'dashboard',
  isDrawerOpen: false,
  themeMode: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
  userSettings: {
    themeMode: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
    defaultRestTime: 60,
    metricUnits: true,
    dashboardLayout: {
      visibility: {
        status: false,
        train: false,
        rest: false,
        'workout-features': false,
        'workout-logs': false,
        'muscle-distribution': false,
        'workout-count': false,
        'total-volume': false,
        'todo-list': false,
        'workout-summary': false,
        'progression-fatigue': false,
        'progression-muscle': false,
        'volume-over-time': false,
        'fatigue-by-muscle': false,
        'progress-goals': false,
        'body-weight': false,
        achievements: false,
        'weekly-summary': false,
        'monthly-summary': false,
        'streak-tracker': false
      }
    },
    notifications: {
      enabled: false,
      workoutReminders: false,
      progressUpdates: false,
      restTimers: true
    },
    privacy: {
      shareData: false,
      anonymousAnalytics: true
    },
    sound: {
      enabled: true,
      volume: 80
    }
  },
  workoutTemplates: [],
  measurementLogs: [],
  todos: [],
  workoutLogs: [],
  exercises: [],
  loading: {
    templates: false,
    measurements: false,
    todos: false,
    logs: false,
    exercises: false
  },
  lastFetched: {
    templates: null,
    measurements: null,
    todos: null,
    logs: null,
    exercises: null
  }
};

type Action = 
  | { type: 'SET_ACCESS_TOKEN'; payload: string | null }
  | { type: 'SET_AUTH_STATUS'; payload: boolean }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_NETWORK_STATUS'; payload: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_USER_SETTINGS'; payload: UserSettings }
  | { type: 'SET_WORKOUT_TEMPLATES'; payload: WorkoutTemplate[] }
  | { type: 'SET_MEASUREMENT_LOGS'; payload: Measurement[] }
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'TOGGLE_TODO'; payload: { index: number; completed: boolean } }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_LAST_FETCHED'; payload: { key: keyof AppState['lastFetched']; value: number | null } }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'SET_WORKOUT_LOGS'; payload: any[] }
  | { type: 'SET_EXERCISES'; payload: Exercise[] };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_ACCESS_TOKEN':
      return {
        ...state,
        accessToken: action.payload,
      };
    case 'SET_AUTH_STATUS':
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case 'TOGGLE_THEME':
      const newTheme = state.isDarkMode ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return {
        ...state,
        isDarkMode: !state.isDarkMode,
        themeMode: newTheme,
      };
    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        isOffline: !action.payload,
      };
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    case 'SET_USER_SETTINGS':
      return {
        ...state,
        userSettings: action.payload,
      };
    case 'SET_WORKOUT_TEMPLATES':
      return {
        ...state,
        workoutTemplates: action.payload,
      };
    case 'SET_MEASUREMENT_LOGS':
      return {
        ...state,
        measurementLogs: action.payload,
      };
    case 'SET_TODOS':
      return {
        ...state,
        todos: action.payload,
      };
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((todo, index) =>
          index === action.payload.index
            ? { ...todo, completed: action.payload.completed }
            : todo
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'SET_LAST_FETCHED':
      return {
        ...state,
        lastFetched: {
          ...state.lastFetched,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'TOGGLE_DRAWER':
      return {
        ...state,
        isDrawerOpen: !state.isDrawerOpen,
      };
    case 'SET_WORKOUT_LOGS':
      return {
        ...state,
        workoutLogs: action.payload,
      };
    case 'SET_EXERCISES':
      return {
        ...state,
        exercises: action.payload,
      };
    default:
      return state;
  }
};

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  toggleTheme: () => void;
  setCurrentPage: (page: string) => void;
  refreshAuth: () => Promise<string | null>;
  navigateTo: (page: string) => void;
  toggleDrawer: () => void;
  fetchWorkoutLogs: (force?: boolean) => Promise<void>;
  fetchExercises: (force?: boolean) => Promise<void>;
  fetchWorkoutTemplates: (force?: boolean) => Promise<void>;
  fetchTodos: (force?: boolean) => Promise<void>;
  fetchBodyMeasurements: (force?: boolean) => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

type AppProviderProps = {
  children: ReactNode;
};

// Time between refreshes (in milliseconds): 5 minutes
const DATA_REFRESH_INTERVAL = 5 * 60 * 1000;

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch data from API with a check to prevent duplicate calls
  const fetchData = useCallback(async (
    dataType: keyof AppState['lastFetched'],
    loadingKey: keyof AppState['loading'],
    fetchFunction: () => Promise<any>,
    dispatchType: string,
    force = false
  ): Promise<void> => {
    // Check if data was recently fetched (within DATA_REFRESH_INTERVAL)
    const lastFetchedTime = state.lastFetched[dataType];
    const shouldFetch = force || 
                        isInitialLoad || 
                        !lastFetchedTime || 
                        (Date.now() - lastFetchedTime > DATA_REFRESH_INTERVAL);
    
    if (!shouldFetch) {
      return;
    }
    
    // Set loading state
    dispatch({ 
      type: 'SET_LOADING', 
      payload: { key: loadingKey, value: true } 
    });
    
    try {
      // Fetch the data
      const result = await fetchFunction();
      
      if (result.success) {
        // Update the data in the context
        dispatch({ 
          type: dispatchType as any, 
          payload: result.data 
        });
        
        // Update the last fetched timestamp
        dispatch({
          type: 'SET_LAST_FETCHED',
          payload: { key: dataType, value: Date.now() }
        });
      } else {
        console.error(`Error fetching ${dataType}:`, result.error);
      }
    } catch (error) {
      console.error(`Error in ${dataType} fetch:`, error);
    } finally {
      // Clear loading state
      dispatch({ 
        type: 'SET_LOADING', 
        payload: { key: loadingKey, value: false } 
      });
    }
  }, [state.lastFetched, isInitialLoad]);

  // Fetch all data on initial load
  useEffect(() => {
    if (isInitialLoad && state.isAuthenticated && state.accessToken) {
      // Initialize data service with the access token
      DataService.initialize(state.accessToken);
      
      // Fetch all data
      Promise.all([
        fetchWorkoutLogs(),
        fetchExercises(),
        fetchWorkoutTemplates(),
        fetchTodos(),
        fetchBodyMeasurements()
      ]).then(() => {
        setIsInitialLoad(false);
      });
    }
  }, [isInitialLoad, state.isAuthenticated, state.accessToken]);

  // Define data fetching functions
  const fetchWorkoutLogs = useCallback((force = false) => {
    return fetchData(
      'logs',
      'logs',
      () => DataService.getWorkoutLogs(force),
      'SET_WORKOUT_LOGS',
      force
    );
  }, [fetchData]);

  const fetchExercises = useCallback((force = false) => {
    return fetchData(
      'exercises',
      'exercises',
      () => DataService.getExercises(force),
      'SET_EXERCISES',
      force
    );
  }, [fetchData]);

  const fetchWorkoutTemplates = useCallback((force = false) => {
    return fetchData(
      'templates',
      'templates',
      () => DataService.getWorkoutTemplates(force),
      'SET_WORKOUT_TEMPLATES',
      force
    );
  }, [fetchData]);

  const fetchTodos = useCallback((force = false) => {
    return fetchData(
      'todos',
      'todos',
      () => DataService.getTodos(force),
      'SET_TODOS',
      force
    );
  }, [fetchData]);

  const fetchBodyMeasurements = useCallback((force = false) => {
    return fetchData(
      'measurements',
      'measurements',
      () => DataService.getBodyMeasurements(force),
      'SET_MEASUREMENT_LOGS',
      force
    );
  }, [fetchData]);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
  }, []);

  const setCurrentPage = useCallback((page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const refreshAuth = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessToken();
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: token });
      dispatch({ type: 'SET_AUTH_STATUS', payload: !!token });
      return token;
    } catch (error) {
      console.error('Auth refresh failed:', error);
      dispatch({ type: 'SET_ACCESS_TOKEN', payload: null });
      dispatch({ type: 'SET_AUTH_STATUS', payload: false });
      return null;
    }
  }, []);

  const toggleDrawer = useCallback(() => {
    dispatch({ type: 'TOGGLE_DRAWER' });
  }, []);

  const navigateTo = useCallback((page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const contextValue = useMemo(() => ({
    state,
    dispatch,
    toggleTheme,
    setCurrentPage,
    refreshAuth,
    navigateTo,
    toggleDrawer,
    fetchWorkoutLogs,
    fetchExercises,
    fetchWorkoutTemplates,
    fetchTodos,
    fetchBodyMeasurements
  }), [
    state, 
    toggleTheme, 
    setCurrentPage, 
    refreshAuth, 
    navigateTo, 
    toggleDrawer,
    fetchWorkoutLogs,
    fetchExercises,
    fetchWorkoutTemplates,
    fetchTodos,
    fetchBodyMeasurements
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};