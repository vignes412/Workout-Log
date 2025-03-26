import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ExerciseList from "./pages/ExerciseList";
import WorkoutPlanner from "./pages/WorkoutPlanner"; // Import new page
import { initClient, syncData } from "./utils/sheetsApi";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import config from "./config";
import "./index.css";

// Define light and dark themes
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
    primary: { main: "#90caf9" },
    secondary: { main: "#f48fb1" },
    background: { default: "#121212", paper: "#424242" },
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

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      const loadData = async () => {
        try {
          await initClient(accessToken);
          await syncData("Workout_Logs!A2:F", "/api/workout", setLogs);
        } catch (error) {
          console.error("Error loading logs:", error);
        }
      };
      loadData();
    }
  }, [isAuthenticated, accessToken]);

  const theme = themeMode === "light" ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={config.google.CLIENT_ID}>
        {renderPage()}
      </GoogleOAuthProvider>
    </ThemeProvider>
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
