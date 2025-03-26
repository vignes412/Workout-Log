import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline"; // Ensures consistent baseline styles
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ExerciseList from "./pages/ExerciseList";
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
  const [themeMode, setThemeMode] = useState("light"); // Default to light theme

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
            toggleTheme={toggleTheme} // Pass toggle function
            themeMode={themeMode} // Pass current theme mode
          />
        );
      case "exerciselist":
        return (
          <ExerciseList
            accessToken={accessToken}
            onNavigate={setCurrentPage}
            toggleTheme={toggleTheme} // Pass toggle function
            themeMode={themeMode} // Pass current theme mode
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
      <CssBaseline /> {/* Ensures consistent styling across themes */}
      {renderPage()}
    </ThemeProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={config.google.CLIENT_ID}>
      <Main />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
