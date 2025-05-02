import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { gapi } from "gapi-script";
import config from "./config";
import TodoList from "./components/TodoList";

const App = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [newItem, setNewItem] = useState({ name: "", value: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { API_KEY, CLIENT_ID, SPREADSHEET_ID, DISCOVERY_DOCS, SCOPES } =
    config.google;
  const { DATA_CACHE_NAME } = config.cache;

  // Watch for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(null); // Clear errors when back online
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load cached data if offline
  useEffect(() => {
    if (isOffline) {
      loadCachedData();
    }
  }, [isOffline]);

  // Initialize Google API client
  useEffect(() => {
    const initClient = () => {
      gapi.load("client", () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          })
          .then(() => {
            if (isAuthenticated) {
              readData();
            }
          })
          .catch((error) => {
            console.error("Error initializing gapi:", error);
            setError("Failed to initialize Google API. Please try again later.");
          });
      });
    };

    initClient();
  }, [isAuthenticated, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES]);

  const loadCachedData = useCallback(async () => {
    try {
      const cachedData = await caches.match("/api/data");
      if (cachedData) {
        const data = await cachedData.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error loading cached data:", error);
      setError("Could not load cached data in offline mode");
    }
  }, []);

  const readData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A2:B",
      });
      const loadedData = response.result.values || [];
      setData(loadedData);
      
      // Cache the data for offline use
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put("/api/data", new Response(JSON.stringify(loadedData)));
      } catch (cacheError) {
        console.warn("Failed to cache data:", cacheError);
      }
    } catch (error) {
      console.error("Error reading data:", error);
      setError("Failed to load data from Google Sheets");
      
      // Try to load from cache as fallback
      await loadCachedData();
    } finally {
      setIsLoading(false);
    }
  }, [SPREADSHEET_ID, DATA_CACHE_NAME, loadCachedData]);

  const createData = useCallback(async () => {
    if (!newItem.name || !newItem.value) {
      setError("Name and value are required");
      return;
    }
    
    if (isOffline) {
      setError("Cannot add new items while offline");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const rowCount = data.length + 2;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${rowCount}:B${rowCount}`,
        valueInputOption: "RAW",
        resource: { values: [[newItem.name, newItem.value]] },
      });
      
      const updatedData = [...data, [newItem.name, newItem.value]];
      setData(updatedData);
      setNewItem({ name: "", value: "" });
      
      // Update cache with new data
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      } catch (cacheError) {
        console.warn("Failed to update cache:", cacheError);
      }
    } catch (error) {
      console.error("Error creating data:", error);
      setError("Failed to add new item to Google Sheets");
    } finally {
      setIsLoading(false);
    }
  }, [newItem, data, isOffline, SPREADSHEET_ID, DATA_CACHE_NAME]);

  const updateData = useCallback(async (index) => {
    if (isOffline) {
      setError("Cannot update items while offline");
      return;
    }
    
    const newValue = prompt("Enter new value:", data[index][1]);
    if (newValue === null) return; // User cancelled
    
    setIsLoading(true);
    setError(null);
    
    try {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!B${index + 2}`,
        valueInputOption: "RAW",
        resource: { values: [[newValue]] },
      });
      
      const updatedData = [...data];
      updatedData[index][1] = newValue;
      setData(updatedData);
      
      // Update cache with new data
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      } catch (cacheError) {
        console.warn("Failed to update cache:", cacheError);
      }
    } catch (error) {
      console.error("Error updating data:", error);
      setError("Failed to update item in Google Sheets");
    } finally {
      setIsLoading(false);
    }
  }, [data, isOffline, SPREADSHEET_ID, DATA_CACHE_NAME]);

  const deleteData = useCallback(async (index) => {
    if (isOffline) {
      setError("Cannot delete items while offline");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${index + 2}:B${index + 2}`,
      });
      
      const updatedData = data.filter((_, i) => i !== index);
      setData(updatedData);
      
      // Update cache with new data
      try {
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      } catch (cacheError) {
        console.warn("Failed to update cache:", cacheError);
      }
      
      // Get the remaining data after this row
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${index + 3}:B`,
      });
      
      const remainingData = response.result.values || [];
      
      // Shift the remaining data up to fill the gap
      if (remainingData.length > 0) {
        await gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Sheet1!A${index + 2}:B`,
          valueInputOption: "RAW",
          resource: { values: remainingData },
        });
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      setError("Failed to delete item from Google Sheets");
      
      // Refresh data to ensure consistency
      readData();
    } finally {
      setIsLoading(false);
    }
  }, [data, isOffline, SPREADSHEET_ID, DATA_CACHE_NAME, readData]);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log("Login Success:", tokenResponse);
      setIsAuthenticated(true);
      setError(null);
      readData();
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      console.error("Error Details:", error.details);
      setError("Login failed. Please try again.");
    },
    onNonOAuthError: (error) => {
      console.error("Non-OAuth Error:", error);
      setError("Login failed due to a non-OAuth error. Please try again.");
    },
    scope: SCOPES,
    flow: "implicit",
  });

  const handleLogout = useCallback(() => {
    googleLogout();
    setIsAuthenticated(false);
    setData([]);
    if (typeof onNavigate === 'function') {
      onNavigate("login");
    }
  }, [onNavigate]);
  
  // Form input handlers
  const handleNameChange = useCallback((e) => {
    setNewItem(prev => ({ ...prev, name: e.target.value }));
  }, []);
  
  const handleValueChange = useCallback((e) => {
    setNewItem(prev => ({ ...prev, value: e.target.value }));
  }, []);
  
  // Optimize the render of the data table
  const dataTable = useMemo(() => {
    if (data.length === 0) {
      return (
        <p>
          {isOffline ? "Offline - No data cached" : "No data available"}
        </p>
      );
    }
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row[0]}</td>
              <td>{row[1]}</td>
              <td>
                <button
                  onClick={() => updateData(index)}
                  disabled={isOffline || isLoading}
                  className="action-button update-button"
                >
                  Update
                </button>
                <button
                  onClick={() => deleteData(index)}
                  disabled={isOffline || isLoading}
                  className="action-button delete-button"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }, [data, isOffline, isLoading, updateData, deleteData]);

  return (
    <div className="App">
      {!isAuthenticated ? (
        <div className="login-container">
          <h1>Workout Log</h1>
          <p>Log in to start tracking your workouts</p>
          {error && <div className="error-message">{error}</div>}
          <button 
            onClick={() => login()} 
            className="login-button"
            disabled={isLoading}
          >
            Login with Google
          </button>
        </div>
      ) : (
        <div className="app-container">
          <header className="app-header">
            <h1>Workout Log</h1>
            <div className="app-status">
              <span className={`status-indicator ${isOffline ? 'offline' : 'online'}`}>
                Status: {isOffline ? "Offline" : "Online"}
              </span>
              <button 
                onClick={handleLogout} 
                className="logout-button"
                disabled={isLoading}
              >
                Logout
              </button>
            </div>
          </header>
          
          {error && <div className="error-message">{error}</div>}
          
          {isLoading && <div className="loading-indicator">Loading...</div>}
          
          <div className="data-input-form">
            <input
              type="text"
              placeholder="Name"
              value={newItem.name}
              onChange={handleNameChange}
              disabled={isOffline || isLoading}
              className="data-input name-input"
            />
            <input
              type="text"
              placeholder="Value"
              value={newItem.value}
              onChange={handleValueChange}
              disabled={isOffline || isLoading}
              className="data-input value-input"
            />
            <button 
              onClick={createData} 
              disabled={isOffline || isLoading || !newItem.name || !newItem.value}
              className="add-button"
            >
              Add Item
            </button>
          </div>

          <div className="data-container">
            {dataTable}
          </div>

          <div className="todo-section">
            <h2>Todo List</h2>
            <TodoList />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
