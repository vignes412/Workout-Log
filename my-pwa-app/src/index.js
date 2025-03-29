import React, { useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ExerciseList from "./pages/ExerciseList";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { initClient, syncData } from "./utils/sheetsApi";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import config from "./config";
import "./index.css";
import BodyMeasurements from "./components/BodyMeasurements";
// import BodyMeasurements from "./components/BodyMeasurements";

const AppContext = createContext();
export const useAppState = () => useContext(AppContext);

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
    background: { default: "#fff", paper: "#f5f5f5" },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#64b5f6" },
    secondary: { main: "#f06292" },
    background: { default: "#212121", paper: "#424242" },
    text: {
      primary: "#ffffff", // Bright white for main text
      secondary: "#b0bec5", // Light gray for secondary text
    },
  },
  typography: {
    h1: { color: "#ffffff" }, // Bright white for h1
    h5: { color: "#ffffff" }, // Bright white for h5
    h6: { color: "#ffffff" }, // Bright white for h6
  },
});

const Main = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("authToken")
  );
  const [currentPage, setCurrentPage] = useState(
    isAuthenticated ? "dashboard" : "login"
  );
  const [themeMode, setThemeMode] = useState("dark");
  const [logs, setLogs] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await Promise.all([
            syncData("Workout_Logs!A2:F", "/api/workout", setLogs),
            syncData(
              "Exercises!A2:D",
              "/api/exercises",
              setExercises,
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
  }, [isAuthenticated, accessToken]);

  const theme = themeMode === "light" ? lightTheme : darkTheme;
  const toggleTheme = () =>
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return (
          <Login
            setIsAuthenticated={setIsAuthenticated}
            setAccessToken={setAccessToken}
            onNavigate={setCurrentPage}
          />
        );
      case "app":
        return <App onNavigate={setCurrentPage} />;
      case "dashboard":
        return (
          <Dashboard
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
            accessToken={accessToken}
            onNavigate={setCurrentPage}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        );
      case "exerciselist":
        return (
          <ExerciseList
            accessToken={accessToken}
            onNavigate={setCurrentPage}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
          />
        );
      case "workoutplanner":
        return (
          <WorkoutPlanner
            accessToken={accessToken}
            onNavigate={setCurrentPage}
          />
        );
      case "bodymeasurements":
        return (
          <BodyMeasurements
            accessToken={accessToken}
            onNavigate={setCurrentPage}
            themeMode={themeMode}
          />
        );
      default:
        return (
          <Login
            setIsAuthenticated={setIsAuthenticated}
            setAccessToken={setAccessToken}
            onNavigate={setCurrentPage}
          />
        );
    }
  };

  return (
    <AppContext.Provider value={{ logs, setLogs, exercises, setExercises }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GoogleOAuthProvider
          clientId={
            process.env.REACT_APP_GOOGLE_CLIENT_ID || config.google.CLIENT_ID
          }
        >
          <ErrorBoundary>{renderPage()}</ErrorBoundary>
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
