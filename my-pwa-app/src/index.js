// src/index.js
import React, {
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
import { initClient, syncData } from "./utils/sheetsApi";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import config from "./config";
import "./styles/global.css";
import BodyMeasurements from "./components/BodyMeasurements";
import { lightTheme, darkTheme } from "./themes/theme";
import {
  Dashboard as DashboardIcon,
  FitnessCenter as WorkoutsIcon,
  DirectionsRun as BodyMeasurementsIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const initialState = {
  isAuthenticated: !!localStorage.getItem("authToken"),
  accessToken: localStorage.getItem("authToken"),
  currentPage: !!localStorage.getItem("authToken") ? "dashboard" : "login",
  themeMode: "dark",
  logs: null,
  exercises: [],
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
    default:
      return state;
  }
};

const AppContext = createContext();
export const useAppState = () => useContext(AppContext);

const Main = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      const loadData = async () => {
        try {
          await initClient(state.accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", (data) =>
              dispatch({ type: "SET_LOGS", payload: data })
            ),
            syncData(
              "Exercises!A2:D",
              "/api/exercises",
              (data) => dispatch({ type: "SET_EXERCISES", payload: data }),
              (row) => ({
                muscleGroup: row[0],
                exercise: row[1],
                exerciseLink: row[2],
                imageLink: row[3],
              })
            ),
          ]);
        } catch (error) {
          console.error("Error loading initial data:", error);
        }
      };
      loadData();
    }
  }, [state.isAuthenticated, state.accessToken]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const scheduleNotification = () => {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(8, 20, 0, 0);

      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilNotification = targetTime - now;

      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(
            "Good Morning! Don't forget to log your workout today!"
          );
        }
        scheduleNotification();
      }, timeUntilNotification);
    };

    scheduleNotification();
  }, []);

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
          />
        );
      case "bodymeasurements":
        return (
          <BodyMeasurements
            accessToken={state.accessToken}
            onNavigate={(page) => dispatch({ type: "SET_PAGE", payload: page })}
            themeMode={state.themeMode}
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

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GoogleOAuthProvider
          clientId={
            process.env.REACT_APP_GOOGLE_CLIENT_ID || config.google.CLIENT_ID
          }
        >
          <ErrorBoundary>
            {renderPage()}
            {state.currentPage != "login" ? (
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
            ) : (
              <></>
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
