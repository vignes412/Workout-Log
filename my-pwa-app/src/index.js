import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useReducer,
} from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ExerciseList from "./pages/ExerciseList";
import ErrorBoundary from "./components/ErrorBoundary";
import { initClient } from "./utils/sheetsApi";
import { syncData, batchFetchData, prefetchData } from "./utils/dataFetcher";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { 
  isAuthenticated, 
  getAccessToken, 
  setupTokenRefresh, 
  logout as authLogout 
} from "./services/authService";
import config from "./config";
import "./styles/global.css";
import BodyMeasurements from "./components/measurements/BodyMeasurements";
import { lightTheme, darkTheme } from "./themes/theme";
import {
  Add,
  Brightness4,
  Brightness7,
  FitnessCenter,
  Settings,
  Menu as MenuIcon,
  Search,
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Message as MessagesIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Work,
} from "@mui/icons-material";

const initialState = {
  isAuthenticated: false, // Will check in useEffect
  accessToken: null,      // Will retrieve in useEffect
  currentPage: "login",   // Default to login
  themeMode: "dark",
  logs: null,
  exercises: [],
  isLoading: {
    logs: false,
    exercises: false
  }
};

const reducer = (state, action) => {
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
      return { ...state, themeMode: action.payload };
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

const AppContext = createContext();
export const useAppState = () => useContext(AppContext);

const Main = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tokenRefreshIntervalId, setTokenRefreshIntervalId] = useState(null);

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
          dispatch({ type: "SET_PAGE", payload: "dashboard" });
        } catch (error) {
          console.error("Initial auth check failed:", error);
          dispatch({
            type: "SET_AUTHENTICATION",
            payload: { isAuthenticated: false, accessToken: null },
          });
        }
      }
    };
    
    checkAuth();
  }, []);

  // Set up token refresh mechanism when authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      // Clear any existing interval
      if (tokenRefreshIntervalId) {
        clearInterval(tokenRefreshIntervalId);
      }
      
      // Set up a new token refresh interval
      const intervalId = setupTokenRefresh();
      setTokenRefreshIntervalId(intervalId);
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      const loadData = async () => {
        try {
          // Set loading state
          dispatch({ type: "SET_LOADING", payload: { key: "logs", value: true } });
          dispatch({ type: "SET_LOADING", payload: { key: "exercises", value: true } });
          
          await initClient(state.accessToken);
          
          // Fetch data in parallel using batchFetchData for efficiency
          const results = await batchFetchData([
            {
              range: "Workout_Logs!A2:F",
              cacheKey: "/api/workout",
              mapFn: (row) => row
            },
            {
              range: "Exercises!A2:D",
              cacheKey: "/api/exercises",
              mapFn: (row) => ({
                muscleGroup: row[0],
                exercise: row[1],
                exerciseLink: row[2],
                imageLink: row[3],
              })
            }
          ]);
          
          // Update state with fetched data
          if (results["/api/workout"]?.data) {
            dispatch({ type: "SET_LOGS", payload: results["/api/workout"].data });
          }
          
          if (results["/api/exercises"]?.data) {
            dispatch({ type: "SET_EXERCISES", payload: results["/api/exercises"].data });
          }
          
          // Pre-fetch other potentially useful data without blocking UI
          if (state.currentPage === "dashboard") {
            // Background prefetch body measurements for dashboard
            prefetchData("Body_Measurements!A2:C", "/api/bodymeasurements")
              .catch(err => console.warn("Failed to prefetch body measurements", err));
          }
        } catch (error) {
          console.error("Error loading initial data:", error);
          // If the error is due to authentication, log the user out
          if (error.message === "Authentication required") {
            handleLogout();
          }
        } finally {
          // Clear loading state regardless of success/failure
          dispatch({ type: "SET_LOADING", payload: { key: "logs", value: false } });
          dispatch({ type: "SET_LOADING", payload: { key: "exercises", value: false } });
        }
      };
      
      // Call loadData only once when authentication changes
      loadData();
    }
  }, [state.isAuthenticated, state.accessToken]);

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
  }, [state.currentPage]);

  const handleLogout = () => {
    // Use the authService logout function
    authLogout();
    
    // Update app state
    dispatch({
      type: "SET_AUTHENTICATION",
      payload: { isAuthenticated: false, accessToken: null },
    });
    dispatch({ type: "SET_PAGE", payload: "login" });
  };

  const theme = state.themeMode === "light" ? lightTheme : darkTheme;

  const renderPage = () => {
    switch (state.currentPage) {
      case "login":
        return (
          <Login
            setIsAuthenticated={(isAuthenticated, accessToken) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken },
              })
            }
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
      case "app":
        return (
          <App
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            isAuthenticated={state.isAuthenticated}
            setIsAuthenticated={(isAuthenticated) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken: null },
              })
            }
            accessToken={state.accessToken}
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
            toggleTheme={() =>
              dispatch({
                type: "SET_THEME",
                payload: state.themeMode === "light" ? "dark" : "light",
              })
            }
            themeMode={state.themeMode}
            onLogout={handleLogout}
            isLoading={state.isLoading}
          />
        );
      case "exerciselist":
        return (
          <ExerciseList
            accessToken={state.accessToken}
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
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
            accessToken={state.accessToken}
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
            themeMode={state.themeMode}
            onLogout={handleLogout}
          />
        );
      case "settings":
        return (
          <Dashboard
            isAuthenticated={state.isAuthenticated}
            setIsAuthenticated={(isAuthenticated) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken: null },
              })
            }
            accessToken={state.accessToken}
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
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
            setIsAuthenticated={(isAuthenticated, accessToken) =>
              dispatch({
                type: "SET_AUTHENTICATION",
                payload: { isAuthenticated, accessToken },
              })
            }
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
          />
        );
    }
  };

  const onNavigate = (path) => {
    if (path === "login") {
      handleLogout();
    }
    dispatch({ type: "SET_PAGE", payload: path });
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
        </GoogleOAuthProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

serviceWorkerRegistration.register();
