import config from "../config";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRES_AT_KEY = "expires_at";
const ID_TOKEN_KEY = "id_token";

// You'll need to replace this with your actual client secret
// NOTE: Including client secrets in client-side code is generally not recommended
// for production applications, but you mentioned you'll manage it manually
// You can get your client secret from the Google Cloud Console:
// https://console.cloud.google.com/ -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs
const CLIENT_SECRET = config.google.CLIENT_SECRET; // <-- Replace this with your actual client secret

/**
 * Handles token exchange for authorization code flow
 * @param {string} code - The authorization code from Google
 * @returns {Promise<Object>} - Token response with access and refresh tokens
 */
export const exchangeCodeForTokens = async (code) => {
  try {
    const tokenEndpoint = "https://oauth2.googleapis.com/token";
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || config.google.CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: window.location.origin,
        grant_type: 'authorization_code',
        code,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error}`);
    }

    const tokenData = await response.json();
    
    // Store tokens
    saveTokens(tokenData);
    
    return tokenData;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token
 * @returns {Promise<Object>} - New token data
 */
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    
    const tokenEndpoint = "https://oauth2.googleapis.com/token";
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || config.google.CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error}`);
    }

    const tokenData = await response.json();
    
    // Save the new access token and expiration
    localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
    
    // Set expiration time (subtract 5 minutes for safety margin)
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000);
    localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
    
    // Note: The refresh token may or may not be returned in the response
    if (tokenData.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
    }

    if (tokenData.id_token) {
      localStorage.setItem(ID_TOKEN_KEY, tokenData.id_token);
    }
    
    return tokenData;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    clearTokens();
    throw error;
  }
};

/**
 * Saves tokens to localStorage
 * @param {Object} tokenData - Token data from OAuth response
 */
export const saveTokens = (tokenData) => {
  if (tokenData.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
  }
  
  if (tokenData.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
  }
  
  if (tokenData.id_token) {
    localStorage.setItem(ID_TOKEN_KEY, tokenData.id_token);
  }
  
  // Set expiration time (subtract 5 minutes for safety margin)
  const expiresIn = tokenData.expires_in || 3600;
  const expiresAt = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000);
  localStorage.setItem(EXPIRES_AT_KEY, expiresAt.toString());
};

/**
 * Clears all tokens from storage
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
};

/**
 * Checks if the user is authenticated with valid tokens
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  
  if (!accessToken || !expiresAt) {
    return false;
  }
  
  // Check if token is expired
  return Date.now() < parseInt(expiresAt, 10);
};

/**
 * Gets the current access token, refreshing if necessary
 * @returns {Promise<string>} - The access token
 */
export const getAccessToken = async () => {
  // If no token or expired, try to refresh
  if (!isAuthenticated()) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const newTokenData = await refreshAccessToken();
        return newTokenData.access_token;
      } catch (error) {
        clearTokens();
        throw new Error("Authentication required");
      }
    } else {
      clearTokens();
      throw new Error("Authentication required");
    }
  }
  
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Handles the logout process
 */
export const logout = () => {
  // Revoke Google access
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).catch(error => console.error("Error revoking token:", error));
  }
  
  // Clear all tokens
  clearTokens();
};

/**
 * Sets up periodic token refresh
 * @param {number} interval - Refresh interval in milliseconds
 * @returns {number} - The interval ID for clearing if needed
 */
export const setupTokenRefresh = (interval = 10 * 60 * 1000) => {
  const intervalId = setInterval(async () => {
    try {
      if (isAuthenticated()) {
        const expiresAt = parseInt(localStorage.getItem(EXPIRES_AT_KEY), 10);
        // Refresh if token will expire in the next 15 minutes
        if (Date.now() > expiresAt - (15 * 60 * 1000)) {
          await refreshAccessToken();
          console.log("Access token refreshed successfully");
        }
      }
    } catch (error) {
      console.error("Error during token refresh:", error);
    }
  }, interval);
  
  return intervalId;
};