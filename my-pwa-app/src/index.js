// src/index.js
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // BrowserRouter, not Router alias
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import config from "./config";
import "./index.css";

// Define basename dynamically
const basename = process.env.NODE_ENV === "production" ? "/Workout-Log" : "/";
console.log(process.env.NODE_ENV);
const Main = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("authToken")
  );

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setAccessToken={setAccessToken}
            />
          }
        />
        <Route path="/app" element={<App />} />
        <Route
          path="/dashboard"
          element={
            <Dashboard
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              accessToken={accessToken}
            />
          }
        />
        {/* Fallback route for unmatched paths */}
        <Route
          path="*"
          element={
            <div>
              <h1>404 - Not Found</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
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
