// src/utils/sheetsApi.js
import { gapi } from "gapi-script";
import config from "../config";
import React from "react";

const { SPREADSHEET_ID, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

let isInitialized = false;

export const initClient = (accessToken) => {
  return new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }
    gapi.load("client", () => {
      gapi.client
        .init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
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
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    return (response.result.values || []).map(mapFn);
  } catch (error) {
    console.error(
      `Fetch Error for range ${range}:`,
      error.result?.error || error
    );
    throw error;
  }
};

export const appendData = async (range, values) => {
  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values: [values] },
    });
  } catch (error) {
    console.error(
      `Append Error for range ${range}:`,
      error.result?.error || error
    );
    throw error;
  }
};

export const clearSheet = async (range) => {
  try {
    await gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    console.log(`Cleared range ${range} successfully`);
  } catch (error) {
    console.error(
      `Clear Error for range ${range}:`,
      error.result?.error || error
    );
    throw error;
  }
};

export const updateData = async (range, values) => {
  try {
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      resource: { values },
    });
    console.log(`Updated range ${range} successfully`);
  } catch (error) {
    console.error(
      `Update Error for range ${range}:`,
      error.result?.error || error
    );
    throw error;
  }
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
  }
};