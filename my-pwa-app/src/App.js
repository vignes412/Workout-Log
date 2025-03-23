// src/App.js
import React, { useState, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { gapi } from "gapi-script";
import config from "./config";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [newItem, setNewItem] = useState({ name: "", value: "" });

  const { API_KEY, CLIENT_ID, SPREADSHEET_ID, DISCOVERY_DOCS, SCOPES } =
    config.google;
  const { DATA_CACHE_NAME } = config.cache;

  useEffect(() => {
    window.addEventListener("online", () => setIsOffline(false));
    window.addEventListener("offline", () => setIsOffline(true));

    if (isOffline) {
      loadCachedData();
    }

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
          });
      });
    };

    initClient();

    return () => {
      window.removeEventListener("online", () => setIsOffline(false));
      window.removeEventListener("offline", () => setIsOffline(true));
    };
  }, [isOffline, isAuthenticated]);

  const loadCachedData = async () => {
    const cachedData = await caches.match("/api/data");
    if (cachedData) {
      const data = await cachedData.json();
      setData(data);
    }
  };

  const readData = async () => {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A2:B",
      });
      const loadedData = response.result.values || [];
      setData(loadedData);
      caches.open(DATA_CACHE_NAME).then((cache) => {
        cache.put("/api/data", new Response(JSON.stringify(loadedData)));
      });
    } catch (error) {
      console.error("Error reading data:", error);
    }
  };

  const createData = async () => {
    if (!newItem.name || !newItem.value || isOffline) return;
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
      caches.open(DATA_CACHE_NAME).then((cache) => {
        cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      });
    } catch (error) {
      console.error("Error creating data:", error);
    }
  };

  const updateData = async (index) => {
    if (isOffline) return;
    const newValue = prompt("Enter new value:", data[index][1]);
    if (newValue === null) return;
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
      caches.open(DATA_CACHE_NAME).then((cache) => {
        cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const deleteData = async (index) => {
    if (
      isOffline ||
      !window.confirm("Are you sure you want to delete this item?")
    )
      return;
    try {
      await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${index + 2}:B${index + 2}`,
      });
      const updatedData = data.filter((_, i) => i !== index);
      setData(updatedData);
      caches.open(DATA_CACHE_NAME).then((cache) => {
        cache.put("/api/data", new Response(JSON.stringify(updatedData)));
      });
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${index + 3}:B`,
      });
      const remainingData = response.result.values || [];
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!A${index + 2}:B`,
        valueInputOption: "RAW",
        resource: { values: remainingData },
      });
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log("Login Success:", tokenResponse);
      setIsAuthenticated(true);
      readData();
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      console.error("Error Details:", error.details);
    },
    onNonOAuthError: (error) => {
      console.error("Non-OAuth Error:", error);
    },
    scope: SCOPES,
    flow: "implicit",
  });

  const handleLogout = () => {
    googleLogout();
    setIsAuthenticated(false);
    setData([]);
  };

  return (
    <div className="App">
      {!isAuthenticated ? (
        <button onClick={() => login()}>Login with Google</button>
      ) : (
        <>
          <h1>CRUD PWA App</h1>
          <p>Status: {isOffline ? "Offline" : "Online"}</p>
          <button onClick={handleLogout}>Logout</button>

          <div>
            <input
              type="text"
              placeholder="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              disabled={isOffline}
            />
            <input
              type="text"
              placeholder="Value"
              value={newItem.value}
              onChange={(e) =>
                setNewItem({ ...newItem, value: e.target.value })
              }
              disabled={isOffline}
            />
            <button onClick={createData} disabled={isOffline}>
              Add Item
            </button>
          </div>

          {data.length > 0 ? (
            <table>
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
                        disabled={isOffline}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => deleteData(index)}
                        disabled={isOffline}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>
              {isOffline ? "Offline - No data cached" : "No data available"}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default App;
