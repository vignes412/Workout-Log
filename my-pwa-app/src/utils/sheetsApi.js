import { gapi } from "gapi-script";
import config from "../config";
import React from "react";
import { getAccessToken, refreshAccessToken } from "../services/authService";

const { SPREADSHEET_ID, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Result of the operation
 */
const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Check if error is due to token expiration
      if (error.status === 401 || 
          error.result?.error?.status === 401 ||
          error.message?.includes("auth") || 
          error.message?.includes("Authentication")) {
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
      
      // Calculate delay with exponential backoff (delay * 2^attempt) with some randomness
      const exponentialDelay = initialDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random());
      console.warn(`Retry ${attempt}/${maxRetries} failed: ${error.message || 'Unknown error'}`);
      console.log(`Retrying in ${Math.round(exponentialDelay / 1000)} seconds...`);
      
      await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
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

export const appendData = async (range, values, accessToken = null) => {
  return retryOperation(async () => {
    // Get a fresh token if none provided
    try {
      const token = accessToken || await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before appending data:", error);
      throw new Error("Authentication required");
    }
    
    // Ensure values is a two-dimensional array
    const formattedValues = Array.isArray(values[0]) ? values : [values];
    
    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: formattedValues },
    });
    
    console.log(`Appended data to ${range} successfully`);
    return response.result;
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

export const updateData = async (range, values, accessToken = null) => {
  return retryOperation(async () => {
    // Get a fresh token if none provided
    try {
      const token = accessToken || await getAccessToken();
      gapi.client.setToken({ access_token: token });
    } catch (error) {
      console.error("Failed to refresh token before updating data:", error);
      throw new Error("Authentication required");
    }
    
    const response = await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
    
    console.log(`Updated range ${range} successfully`);
    return response.result;
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

export const saveBodyMeasurementToSheet = async (range, row, accessToken = null) => {
  // Simply use our improved appendData function
  return appendData(range, row, accessToken);
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
