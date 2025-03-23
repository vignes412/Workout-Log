// src/index.js
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
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
const basename =
  process.env.NODE_ENV === "production"
    ? "/Workout-Log" // GitHub Pages base path
    : "/";
  return (
    <Router>
      <Routes>
        <Route
          path="/Workout-Log/"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setAccessToken={setAccessToken}
            />
          }
        />
        <Route path="/app" element={<App />} />
        <Route
          path="/Workout-Log/dashboard"
          element={
            <Dashboard
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              accessToken={accessToken}
            />
          }
        />
      </Routes>
    </Router>
  );
};

console.log("index.js running");
const container = document.getElementById("root");
console.log("Root element:", container);
if (!container) {
  console.error("Root element not found");
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={config.google.CLIENT_ID}>
      <Main />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
