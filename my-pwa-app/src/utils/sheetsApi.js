import { gapi } from "gapi-script";
import config from "../config";
import React from "react";

const { SPREADSHEET_ID, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.warn(`Retry ${attempt}/${maxRetries} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};

export const initClient = (accessToken) => {
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
          gapi.client.setToken({ access_token: accessToken });
          console.log(
            "GAPI Client Initialized with Spreadsheet ID:",
            SPREADSHEET_ID
          );
          isInitialized = true;
          resolve();
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
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return (response.result.values || []).map(mapFn);
  });
};

export const appendData = async (range, values) => {
  return retryOperation(async () => {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: [values] },
    });
  });
};

export const clearSheet = async (range) => {
  return retryOperation(async () => {
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    console.log(`Cleared range ${range} successfully`);
  });
};

export const updateData = async (range, values) => {
  return retryOperation(async () => {
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${
    process.env.REACT_APP_SPREADSHEET_ID || config.google.SPREADSHEET_ID
  }/values/${range}:append?valueInputOption=RAW`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: values,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to append data: ${error.error.message}`);
  }
  return response.json();
};
