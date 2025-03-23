// src/utils/sheetsApi.js
import { gapi } from "gapi-script";
import config from "../config";
import React from "react";

const { SPREADSHEET_ID, API_KEY, CLIENT_ID, DISCOVERY_DOCS, SCOPES } =
  config.google;
const { DATA_CACHE_NAME } = config.cache;

export const initClient = (accessToken) => {
  return new Promise((resolve, reject) => {
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
          resolve();
        })
        .catch(reject);
    });
  });
};

export const fetchData = async (range, mapFn = (row) => row) => {
  const response = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (response.result.values || []).map(mapFn);
};

export const appendData = async (range, values) => {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "RAW",
    resource: { values: [values] },
  });
};

export const cacheData = async (cacheKey, data) => {
  const cache = await caches.open(DATA_CACHE_NAME);
  await cache.put(cacheKey, new Response(JSON.stringify(data)));
};

export const loadCachedData = async (cacheKey) => {
  const cachedData = await caches.match(cacheKey);
  return cachedData ? await cachedData.json() : null;
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

export const syncData = async (range, cacheKey, setData, mapFn) => {
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
