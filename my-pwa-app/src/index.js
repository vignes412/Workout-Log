import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import ExerciseList from "./pages/ExerciseList"; // New component
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import config from "./config";
import "./index.css";

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
          />
        );
      case "exerciselist": // New page
        return (
          <ExerciseList accessToken={accessToken} onNavigate={setCurrentPage} />
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

  return <div>{renderPage()}</div>;
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
