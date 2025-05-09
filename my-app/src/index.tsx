/// <reference types="react" />

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useReducer,
  ReactNode
} from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ExerciseList from "./pages/ExerciseList";
import WorkoutTemplates from "./pages/WorkoutTemplates";
import WorkoutTemplateBuilder from "./pages/WorkoutTemplateBuilder";
import TodaysWorkout from "./pages/TodaysWorkout";
import ErrorBoundary from "./components/ErrorBoundary";
import { initClient, fetchData } from "./utils/sheetsApi";
import { prefetchData } from "./utils/dataFetcher";
import { 
  isAuthenticated, 
  getAccessToken, 
  setupTokenRefresh, 
  logout as authLogout,
  updateAuthState,
  refreshAccessToken
} from "./services/authService";
import config from "./config";
import "./styles/global.css";
import BodyMeasurements from "./components/measurements/BodyMeasurements";
import { lightTheme, darkTheme } from "./themes/theme";
import {
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import UpdateNotification from './components/shared/UpdateNotification';
import NetworkStatusNotifier from './components/shared/NetworkStatusNotifier';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { loadPendingMutations, processPendingMutations } from './utils/sheetsApi';
import { preCacheEssentialData } from './utils/dataFetcher';
import { AppProvider } from './context/AppContext';

interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  currentPage: string;
  themeMode: 'light' | 'dark';  // Update to use union type instead of string
  logs: any | null;
  exercises: any[];
  isLoading: {
    logs: boolean;
    exercises: boolean;
    [key: string]: boolean;
  };
}

interface AppAction {
  type: string;
  payload: any;
}

const initialState: AppState = {
  isAuthenticated: false, // Will check in useEffect
  accessToken: null,      // Will retrieve in useEffect
  currentPage: "login",   // Default to login
  themeMode: (localStorage.getItem("themeMode") as 'light' | 'dark') || "dark",
  logs: null,
  exercises: [],
  isLoading: {
    logs: false,
    exercises: false
  }
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SET_AUTHENTICATION":
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        accessToken: action.payload.accessToken,
      };
    case "SET_PAGE":
      return { ...state, currentPage: action.payload };
    case "SET_THEME":
      const newTheme = action.payload;
      localStorage.setItem("themeMode", newTheme);
      return { ...state, themeMode: newTheme };
    case "SET_LOGS":
      return { ...state, logs: action.payload };
    case "SET_EXERCISES":
      return { ...state, exercises: action.payload };
    case "SET_LOADING":
      return { 
        ...state, 
        isLoading: { 
          ...state.isLoading, 
          [action.payload.key]: action.payload.value 
        } 
      };
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useAppState = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

// Define the props as exported interfaces to avoid 'unused' warnings
export interface LoginProps {
  setIsAuthenticated: (isAuthenticated: boolean, accessToken?: string) => void;
  onNavigate: (page: string) => void;
}

export interface BodyMeasurementsProps {
  accessToken: string | null;
  onNavigate: (page: string) => void;
  themeMode: 'light' | 'dark';
  onLogout?: () => void;
}

const Main = (): React.ReactElement => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tokenRefreshIntervalId, setTokenRefreshIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState<boolean>(false);

  // Define handleLogout at the top, before it's used in useEffect
  const handleLogout = () => {
    // Use the authService logout function
    authLogout();
    
    // Update app state
    dispatch({
      type: "SET_AUTHENTICATION",
      payload: { isAuthenticated: false, accessToken: null },
    });
    dispatch({ type: "SET_PAGE", payload: "login" });
    
    // Optionally show a toast notification
    if ((window as any).showToast) {
      (window as any).showToast("Successfully logged out", "success");
    }
  };

  // Check authentication status on app init
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          const token = await getAccessToken();
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: true, accessToken: token },
          });
          
          // Only navigate to dashboard if we're on the login page
          if (state.currentPage === "login") {
            dispatch({ type: "SET_PAGE", payload: "dashboard" });
          }
        } catch (error) {
          console.error("Initial auth check failed:", error);
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: false, accessToken: null },
          });
          // Only force navigate to login if auth check actually failed
          if ((error as Error).message === "Authentication required") {
            dispatch({ type: "SET_PAGE", payload: "login" });
          }
        }
      }
      setInitialAuthCheckDone(true);
    };
    
    checkAuth();

    // Listen for auth state changes
    const handleAuthChange = async () => {
      if (isAuthenticated()) {
        try {
          const token = await getAccessToken();
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: true, accessToken: token },
          });
        } catch (error) {
          console.error("Auth state change check failed:", error);
        }
      } else {
        dispatch({
          type: "SET_AUTHENTICATION",
          payload: { isAuthenticated: false, accessToken: null },
        });
        dispatch({ type: "SET_PAGE", payload: "login" });
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [state.currentPage]); // Add state.currentPage as a dependency

  // Set up token refresh mechanism when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      // Clear any existing interval
      if (tokenRefreshIntervalId) {
        clearInterval(tokenRefreshIntervalId);
      }
      
      // Set up a new token refresh interval
      const intervalId = setupTokenRefresh(5 * 60 * 1000); // refresh every 5 minutes
      setTokenRefreshIntervalId(intervalId);
      
      // Update auth state in case it wasn't set, but suppress the event to avoid infinite loop
      updateAuthState(true, true); // Pass true for suppressEvent parameter
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [state.isAuthenticated, tokenRefreshIntervalId]);

  // Load data when authenticated - fix React Hook deps
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken && initialAuthCheckDone) {
      const loadData = async () => {
        // Check to see if we already have data loaded
        if (state.logs && state.exercises.length > 0) {
          return; // Skip loading if we already have data
        }
        
        try {
          // Set loading state
          dispatch({ type: "SET_LOADING", payload: { key: "logs", value: true } });
          dispatch({ type: "SET_LOADING", payload: { key: "exercises", value: true } });
          
          await initClient(state.accessToken || '');
          
          // Use individual fetchData calls instead of batchFetchData
          try {
            const logsResponse = await fetchData("Workout_Logs!A2:F");
            if (logsResponse.success && logsResponse.data) {
              dispatch({ type: "SET_LOGS", payload: logsResponse.data });
            }
          } catch (error) {
            console.error("Error loading workout logs:", error);
          } finally {
            dispatch({ type: "SET_LOADING", payload: { key: "logs", value: false } });
          }
          
          try {
            const exercisesResponse = await fetchData("Exercises!A2:D");
            if (exercisesResponse.success && exercisesResponse.data) {
              const formattedExercises = exercisesResponse.data.map((row: any) => ({
                muscleGroup: row[0],
                exercise: row[1],
                exerciseLink: row[2],
                imageLink: row[3],
              }));
              
              dispatch({ type: "SET_EXERCISES", payload: formattedExercises });
            }
          } catch (error) {
            console.error("Error loading exercises:", error);
          } finally {
            dispatch({ type: "SET_LOADING", payload: { key: "exercises", value: false } });
          }
          
          // Pre-fetch other potentially useful data without blocking UI
          if (state.currentPage === "dashboard") {
            // Background prefetch body measurements for dashboard
            try {
              await fetchData("Body_Measurements!A2:C");
              console.log("Successfully prefetched body measurements");
            } catch (err) {
              console.warn("Failed to prefetch body measurements", err);
            }
          }
        } catch (error) {
          console.error("Error loading initial data:", error);
          // Only log out if the error is specifically an auth error
          if ((error as Error).message === "Authentication required") {
            handleLogout();
          }
        }
      };
      
      // Call loadData only once when authentication changes
      loadData();
    }
  }, [state.isAuthenticated, state.accessToken, initialAuthCheckDone, state.currentPage, state.logs, state.exercises.length, handleLogout]);

  useEffect(() => {
    if (state.exercises.length > 0 && navigator.serviceWorker.controller) {
      const imageUrls = state.exercises
        .map((exercise) => exercise.imageLink)
        .filter(Boolean);
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_IMAGES",
        urls: imageUrls,
      });
    }
  }, [state.exercises]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1) || "login";
      dispatch({ type: "SET_PAGE", payload: path });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  
  // Prefetch data for the next page when user navigates
  useEffect(() => {
    // Store current state values in variables to avoid closure issues
    const { currentPage, isAuthenticated, accessToken, exercises } = state;
    
    if (isAuthenticated && accessToken) {
      // Determine what data to prefetch based on current page
      const prefetchForCurrentPage = async () => {
        try {
          switch (currentPage) {
            case "dashboard":
              // Dashboard already loads the main data
              break;
            case "exerciselist":
              // Ensure exercises are loaded for the exercise list page
              if (!exercises || exercises.length === 0) {
                // Use a different approach to prevent infinite updates
                // Don't directly update state inside this effect
                prefetchData(
                  "Exercises!A2:D",
                  "/api/exercises"
                ).catch(err => console.warn("Failed to prefetch exercises", err));
              }
              break;
            case "bodymeasurements":
              // Prefetch body measurements data without callback
              prefetchData("Body_Measurements!A2:C", "/api/bodymeasurements")
                .catch(err => console.warn("Failed to prefetch body measurements", err));
              break;
            default:
              break;
          }
        } catch (error) {
          console.warn("Error prefetching data:", error);
        }
      };
      
      // Use a flag to ensure we only run this once per page change
      const prefetchTimeoutId = setTimeout(() => {
        prefetchForCurrentPage();
      }, 0);
      
      return () => clearTimeout(prefetchTimeoutId);
    }
  }, [state]); // Fix by including the entire state as a dependency

  // Handle service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC_COMPLETED') {
        // Show toast notification when background sync completes
        if ((window as any).showToast) {
          (window as any).showToast("Data synchronized successfully", "success");
        }
      } else if (event.data && event.data.type === 'AUTH_REFRESH_NEEDED') {
        // Service worker requested token refresh
        if (state.isAuthenticated) {
          refreshAccessToken().catch(console.error);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [state.isAuthenticated]);

  // Set up online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online, processing pending mutations...');
      processPendingMutations().catch(console.error);
      if (state.isAuthenticated) {
        refreshAccessToken().catch(console.error);
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Initialize offline support
    loadPendingMutations().catch(console.error);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [state.isAuthenticated]);

  // Pre-cache essential data when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      preCacheEssentialData().catch(console.error);
    }
  }, [state.isAuthenticated, state.accessToken]);

  const theme = state.themeMode === "light" ? lightTheme : darkTheme;

  const renderPage = (): ReactNode => {
    switch (state.currentPage) {
      case "login":
        return (
          <Login
            setIsAuthenticated={(isAuthenticated: boolean, accessToken?: string) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken: accessToken || null },
              })
            }
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
      case "app":
        return (
          <App
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
      case "dashboard":
        return <Dashboard />;
      case "workoutTemplates":
        return (
          <WorkoutTemplates
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
          />
        );
      case "workoutTemplateBuilder":
        return (
          <WorkoutTemplateBuilder
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
          />
        );
      case "todaysWorkout":
        return (
          <TodaysWorkout
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
          />
        );
      case "exerciselist":
        return (
          <ExerciseList
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
            onLogout={handleLogout}
            isLoading={state.isLoading.exercises}
          />
        );
      case "bodymeasurements":
        return (
          <BodyMeasurements
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            themeMode={state.themeMode}
            onLogout={handleLogout}
          />
        );
      case "settings":
        return (
          <Dashboard
            isAuthenticated={state.isAuthenticated}
            setIsAuthenticated={(isAuthenticated: boolean) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken: null },
              })
            }
            accessToken={state.accessToken || ""}
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
            onLogout={handleLogout}
            settingsOpen={true}
            isLoading={state.isLoading}
          />
        );
      default:
        return (
          <Login
            setIsAuthenticated={(isAuthenticated: boolean, accessToken?: string) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken: accessToken || null },
              })
            }
            onNavigate={(page: string) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
    }
  };

  const onNavigate = (path: string) => {
    // Only log out if explicitly navigating to the login page
    if (path === "login" && state.currentPage !== "login") {
      handleLogout();
    } else {
      dispatch({ type: "SET_PAGE", payload: path });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GoogleOAuthProvider
          clientId={
            process.env.REACT_APP_GOOGLE_CLIENT_ID || config.google.CLIENT_ID
          }
        >
          <ErrorBoundary onNavigate={onNavigate}>
            {renderPage()}
            {state.currentPage !== "login" && (
              <div className="bottom-menu">
                <div
                  className="bottom-menu-item"
                  onClick={() =>
                    dispatch({ type: "SET_PAGE", payload: "dashboard" })
                  }
                >
                  <DashboardIcon />
                </div>
                <div
                  className="bottom-menu-item"
                  onClick={() =>
                    dispatch({ type: "SET_PAGE", payload: "exerciselist" })
                  }
                >
                  <WorkoutsIcon />
                </div>
                <div
                  className="bottom-menu-item"
                  onClick={() =>
                    dispatch({ type: "SET_PAGE", payload: "bodymeasurements" })
                  }
                >
                  <BodyMeasurementsIcon />
                </div>
                <div
                  className="bottom-menu-item"
                  onClick={() =>
                    dispatch({ type: "SET_PAGE", payload: "settings" })
                  }
                >
                  <SettingsIcon />
                </div>
              </div>
            )}
          </ErrorBoundary>
          <UpdateNotification />
          <NetworkStatusNotifier />
        </GoogleOAuthProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error('Root element not found');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AppProvider>
      <Main />
    </AppProvider>
  </React.StrictMode>
);

// Register the service worker
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    console.log('Service worker updated', registration);
  },
  onRefreshNeeded: () => {
    console.log('Token refresh requested by service worker');
  }
});