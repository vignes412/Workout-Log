import config from "../config";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRES_AT_KEY = "expires_at";
const ID_TOKEN_KEY = "id_token";
const AUTH_STATE_KEY = "auth_state"; // New key for tracking auth state

// You'll need to replace this with your actual client secret
// NOTE: Including client secrets in client-side code is generally not recommended
// for production applications, but you mentioned you'll manage it manually
// You can get your client secret from the Google Cloud Console:
// https://console.cloud.google.com/ -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs
const CLIENT_SECRET = config.google.CLIENT_SECRET; // <-- Replace this with your actual client secret

// Track refresh attempts to prevent infinite loops
let refreshAttemptInProgress = false;
let refreshAttemptQueue = [];

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
    
    // Update auth state
    updateAuthState(true);
    
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
    // If a refresh is already in progress, add to the queue and wait
    if (refreshAttemptInProgress) {
      return new Promise((resolve, reject) => {
        refreshAttemptQueue.push({ resolve, reject });
      });
    }
    
    refreshAttemptInProgress = true;
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
    
    // Update auth state
    updateAuthState(true);
    
    // Process any queued refreshes
    refreshAttemptQueue.forEach(request => request.resolve(tokenData));
    refreshAttemptQueue = [];
    
    refreshAttemptInProgress = false;
    return tokenData;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    
    // Process any queued refreshes with the error
    refreshAttemptQueue.forEach(request => request.reject(error));
    refreshAttemptQueue = [];
    
    refreshAttemptInProgress = false;
    
    // If the refresh token is invalid, clear tokens and update state
    if (error.message.includes("invalid_grant") || error.message.includes("Token refresh failed")) {
      clearTokens();
      updateAuthState(false);
    }
    
    throw error;
  }
};

/**
 * Updates the authentication state in localStorage
 * @param {boolean} isAuthenticated - The authentication state
 */
export const updateAuthState = (isAuthenticated) => {
  if (isAuthenticated) {
    localStorage.setItem(AUTH_STATE_KEY, "true");
    // Dispatch an event that other parts of the app can listen for
    window.dispatchEvent(new Event('authStateChanged'));
  } else {
    localStorage.removeItem(AUTH_STATE_KEY);
    window.dispatchEvent(new Event('authStateChanged'));
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
  
  // Update auth state
  updateAuthState(true);
};

/**
 * Clears all tokens from storage
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  updateAuthState(false);
};

/**
 * Checks if the user is authenticated with valid tokens
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  // First, check the auth state for a quick answer
  const authState = localStorage.getItem(AUTH_STATE_KEY);
  
  // If we have tokens but no auth state, update the auth state
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!authState && (accessToken || refreshToken)) {
    // Check if the token is expired
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    
    if (accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
      // We have a valid access token
      updateAuthState(true);
      return true;
    } else if (refreshToken) {
      // We have a refresh token, assume logged in and trigger a refresh
      updateAuthState(true);
      // Trigger a refresh in the background
      setTimeout(() => {
        refreshAccessToken().catch(() => {
          // If refresh fails, will clear tokens and update state
        });
      }, 0);
      return true;
    }
  }
  
  return authState === "true";
};

/**
 * Gets the current access token, refreshing if necessary
 * @returns {Promise<string>} - The access token
 */
export const getAccessToken = async () => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  
  // If we have a valid token, use it
  if (accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
    return accessToken;
  }
  
  // Otherwise try to refresh
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      const newTokenData = await refreshAccessToken();
      return newTokenData.access_token;
    } catch (error) {
      // Only clear tokens if this is an auth error
      if (error.message.includes("invalid_grant") || 
          error.message.includes("Token refresh failed")) {
        clearTokens();
      }
      throw new Error("Authentication required");
    }
  } else {
    clearTokens();
    throw new Error("Authentication required");
  }
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

// Alias for backward compatibility
export const authLogout = logout;

/**
 * Sets up periodic token refresh
 * @param {number} interval - Refresh interval in milliseconds
 * @returns {number} - The interval ID for clearing if needed
 */
export const setupTokenRefresh = (interval = 5 * 60 * 1000) => { // Reduced interval to 5 minutes
  const intervalId = setInterval(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
      
      if (!refreshToken) {
        // No refresh token, nothing to do
        return;
      }
      
      // Refresh if:
      // 1. No access token or no expiration
      // 2. Token will expire in the next 10 minutes
      if (!accessToken || !expiresAt || 
          Date.now() > parseInt(expiresAt, 10) - (10 * 60 * 1000)) {
        await refreshAccessToken();
        console.log("Access token refreshed successfully");
      }
    } catch (error) {
      console.error("Error during token refresh:", error);
      // Only log out if this is an auth error
      if (error.message.includes("invalid_grant") || 
          error.message.includes("Token refresh failed")) {
        clearTokens();
      }
    }
  }, interval);
  
  return intervalId;
};

// Initialize auth state listener
if (typeof window !== 'undefined') {
  // Set initial auth state if needed
  const hasTokens = !!localStorage.getItem(ACCESS_TOKEN_KEY) || !!localStorage.getItem(REFRESH_TOKEN_KEY);
  const authState = localStorage.getItem(AUTH_STATE_KEY);
  
  if (hasTokens && !authState) {
    updateAuthState(true);
  }
}