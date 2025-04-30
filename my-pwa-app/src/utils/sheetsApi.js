import { gapi } from "gapi-script";
import config from "../config";
import React from "react";
import { getAccessToken, refreshAccessToken } from "../services/authService";

const { SPREADSHEET_ID, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Check if error is due to token expiration
      if (error.status === 401 || error.message?.includes("auth")) {
        try {
          // Try to refresh the token
          await refreshAccessToken();
          
          // If token refresh succeeds, retry the operation immediately
          if (attempt < maxRetries) {
            console.log("Token refreshed, retrying operation");
            continue;
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw new Error("Authentication required");
        }
      }
      
      if (attempt === maxRetries) throw error;
      console.warn(`Retry ${attempt}/${maxRetries} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

export const initClient = async (accessToken) => {
  return new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }
    
    gapi.load("client", () => {
      gapi.client
        .init({
          apiKey: process.env.REACT_APP_GOOGLE_API_KEY || API_KEY,
          clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        .then(() => {
          // Use the provided access token or get a fresh one
          const token = accessToken || localStorage.getItem("access_token");
          if (token) {
            gapi.client.setToken({ access_token: token });
            console.log(
              "GAPI Client Initialized with Spreadsheet ID:",
              SPREADSHEET_ID
            );
            isInitialized = true;
            resolve();
          } else {
            reject(new Error("No access token available"));
          }
        })
        .catch((error) => {
          console.error("GAPI Initialization Error:", error);
          reject(error);
        });
    });
  });
};

export const fetchData = async (range, mapFn = (row) => row) => {
  return retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before fetching data:", error);
      throw new Error("Authentication required");
    }
    
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return (response.result.values || []).map(mapFn);
  });
};

export const appendData = async (range, values) => {
  return retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before appending data:", error);
      throw new Error("Authentication required");
    }
    
    // Ensure values is a two-dimensional array
    const formattedValues = Array.isArray(values[0]) ? values : [values];
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: formattedValues },
    });
  });
};

export const clearSheet = async (range) => {
  return retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before clearing sheet:", error);
      throw new Error("Authentication required");
    }
    
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    console.log(`Cleared range ${range} successfully`);
  });
};

export const updateData = async (range, values) => {
  return retryOperation(async () => {
    // Get a fresh token before making the request
    try {
      const token = await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before updating data:", error);
      throw new Error("Authentication required");
    }
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
    console.log(`Updated range ${range} successfully`);
  });
};

export const cacheData = async (cacheKey, data) => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(cacheKey, new Response(JSON.stringify(data)));
  } catch (error) {
    console.error(`Cache Error for ${cacheKey}:`, error);
  }
};

export const loadCachedData = async (cacheKey) => {
  try {
    const cache = await caches.match(cacheKey);
    return cache ? await cache.json() : null;
  } catch (error) {
    console.error(`Load Cache Error for ${cacheKey}:`, error);
    return null;
  }
};

export const useOnlineStatus = (setIsOffline) => {
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setIsOffline]);
};

export const syncData = async (
  range,
  cacheKey,
  setData,
  mapFn = (row) => row
) => {
  if (typeof setData !== "function") {
    throw new Error("setData must be a function");
  }

  try {
    const data = await fetchData(range, mapFn);
    setData(data);
    await cacheData(cacheKey, data);
  } catch (error) {
    const cached = await loadCachedData(cacheKey);
    if (cached) setData(cached);
    console.error(`Sync error for ${range}:`, error);
    throw error; // Re-throw for UI notification
  }
};

export const appendData2 = async (range, values, accessToken) => {
  try {
    // Get a fresh token if none provided
    const token = accessToken || await getAccessToken();
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${
      process.env.REACT_APP_SPREADSHEET_ID || config.google.SPREADSHEET_ID
    }/values/${range}:append?valueInputOption=RAW`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: values,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Check if token has expired
      if (response.status === 401) {
        // Try to refresh the token and retry once
        try {
          const newToken = await refreshAccessToken();
          return appendData2(range, values, newToken.access_token);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw new Error("Authentication required");
        }
      }
      throw new Error(`Failed to append data: ${error.error.message}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error in appendData2:", error);
    throw error;
  }
};

export const saveBodyMeasurementToSheet = async (range, row, accessToken) => {
  return retryOperation(async () => {
    // Get a fresh token if none provided
    try {
      const token = accessToken || await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before saving body measurement:", error);
      throw new Error("Authentication required");
    }
    
    const formattedValues = Array.isArray(row[0]) ? row : [row];
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: formattedValues },
    });
    console.log(`Saved body measurement to ${range} successfully`);
  });
};

export const fetchTodos = async () => {
  return fetchData("ToDO", (row) => ({
    text: row[0],
    completed: row[1].toLowerCase() === "true",
  }));
};

export const appendTodo = async (todo) => {
  return appendData("ToDO", [[todo.text, todo.completed]]);
};

export const updateTodos = async (todos) => {
  return updateData(
    "ToDO",
    todos.map((todo) => [todo.text, todo.completed])
  );
};
