import config from "../config";
import { v4 as uuidv4 } from 'uuid';

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRES_AT_KEY = "expires_at";
const ID_TOKEN_KEY = "id_token";
const AUTH_STATE_KEY = "auth_state";
const CODE_VERIFIER_KEY = "code_verifier";

// PKCE (Proof Key for Code Exchange) Support
// This is a secure way to perform OAuth without exposing client secrets

/**
 * Generates a random string for PKCE
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Creates a code challenge from verifier for PKCE
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp in ms
  idToken?: string;
}

/**
 * Generate auth URL for Google OAuth2
 * @returns Promise resolving to the authorization URL
 */
export const generateAuthUrl = async (): Promise<string> => {
  const googleOAuthConfig = config.google;
  
  // Generate a random state value to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2);
  localStorage.setItem('auth_state', state);
  
  const params = new URLSearchParams({
    client_id: googleOAuthConfig.CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: googleOAuthConfig.SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Initiates the OAuth authorization code flow with PKCE
 */
export const initiateAuthCodeFlow = async (): Promise<void> => {
  try {
    // Generate and store a code verifier for PKCE
    const codeVerifier = generateRandomString(128);
    
    // Store in both localStorage and sessionStorage for redundancy
    localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    
    // Also store the timestamp to check for stale verifiers
    localStorage.setItem(CODE_VERIFIER_KEY + '_timestamp', Date.now().toString());
    
    // Generate code challenge from the verifier
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Generate a state parameter to protect against CSRF
    const state = uuidv4();
    
    // Store the state for validation on callback
    localStorage.setItem('auth_state', state);
    
    // Build the authorization URL
    const authUrl = new URL(config.google.AUTH_ENDPOINT);
    authUrl.searchParams.append('client_id', config.google.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', config.google.REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', config.google.SCOPES);
    authUrl.searchParams.append('state', state);
    
    // Add PKCE parameters
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    // Add prompt and access_type for better UX and offline access
    authUrl.searchParams.append('prompt', 'select_account');
    authUrl.searchParams.append('access_type', 'offline');
    
    console.log("Initiating auth flow with code verifier:", codeVerifier.substring(0, 10) + "...");
    
    // Redirect to the authorization URL
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error("Error initiating auth flow:", error);
    throw error;
  }
};

/**
 * Exchanges authorization code for tokens using PKCE
 * @param code - The authorization code from Google
 * @returns - Token response with access and refresh tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<TokenData> => {
  try {
    // Try to get the code verifier from various storage locations
    let codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
    
    // If not in localStorage, try sessionStorage
    if (!codeVerifier) {
      console.log("Code verifier not found in localStorage, checking sessionStorage");
      codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    }
    
    if (!codeVerifier) {
      console.error("Code verifier not found in any storage");
      throw new Error("Code verifier not found. Authentication flow may have been interrupted.");
    }
    
    // Create the token request parameters
    const params = new URLSearchParams({
      client_id: config.google.CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.google.REDIRECT_URI,
      code_verifier: codeVerifier,
    });
    
    // Optional: add client_secret if your app is configured to use it
    if (config.google.CLIENT_SECRET) {
      params.append('client_secret', config.google.CLIENT_SECRET);
    }
    
    console.log("Exchanging code for tokens with following params:", {
      clientId: config.google.CLIENT_ID,
      redirectUri: config.google.REDIRECT_URI,
      codeVerifierLength: codeVerifier.length
    });
    
    const tokenEndpoint = config.google.TOKEN_ENDPOINT;
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Token exchange failed with status:", response.status, responseData);
      // More detailed error for debugging
      throw new Error(`Token exchange failed: ${responseData.error}${responseData.error_description ? ' - ' + responseData.error_description : ''}`);
    }

    const tokenData: TokenData = responseData;
    
    // Validate the response has an access token
    if (!tokenData.access_token) {
      throw new Error("Invalid token response: No access token received");
    }
    
    // Store tokens
    saveTokens(tokenData);
    
    // Update auth state
    updateAuthState(true);
    
    // Clear the code verifier as it's no longer needed
    localStorage.removeItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    localStorage.removeItem(CODE_VERIFIER_KEY + '_timestamp');
    
    return tokenData;
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    // Clear any partial auth state to be safe
    clearTokens();
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token
 * @param refreshToken The refresh token
 * @returns Promise resolving to the new access token
 */
const refreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const response = await fetch(config.google.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.google.CLIENT_ID,
        client_secret: config.google.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    // Calculate expiration time
    const expiresIn = data.expires_in || 3600; // default to 1 hour if not provided
    const expiresAt = Date.now() + (expiresIn * 1000);
    
    // Update stored tokens
    const updatedTokens: AuthTokens = {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Keep the existing refresh token
      expiresAt,
      idToken: data.id_token || getStoredTokens()?.idToken, // Keep existing ID token if not provided
    };
    
    // Store the updated tokens
    storeTokens(updatedTokens);
    
    // Notify the application that auth state has changed
    // Use suppressEvent=true to prevent potential infinite loops
    updateAuthState(true, true);
    
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token
 * @returns - New token data
 */
export const refreshAccessToken = async (): Promise<void> => {
  if (!isAuthenticated()) {
    return;
  }
  
  const tokens = getStoredTokens();
  if (tokens?.refreshToken) {
    try {
      await refreshToken(tokens.refreshToken);
      console.log('Token refreshed successfully by service worker request');
    } catch (error) {
      console.error('Failed to refresh token from service worker request:', error);
    }
  }
};

/**
 * Updates the authentication state in localStorage
 * @param isAuthenticated - The authentication state
 * @param suppressEvent - Optional flag to prevent dispatching the event (to avoid loops)
 */
export const updateAuthState = (isAuthenticated: boolean, suppressEvent: boolean = false): void => {
  if (isAuthenticated) {
    localStorage.setItem(AUTH_STATE_KEY, "true");
    
    // Only dispatch event if not suppressed
    if (!suppressEvent) {
      // Dispatch an event that other parts of the app can listen for
      const event = new CustomEvent('authStateChanged', {
        detail: { isAuthenticated }
      });
      window.dispatchEvent(event);
    }
  } else {
    localStorage.removeItem(AUTH_STATE_KEY);
    
    // Only dispatch event if not suppressed
    if (!suppressEvent) {
      const event = new CustomEvent('authStateChanged', {
        detail: { isAuthenticated: false }
      });
      window.dispatchEvent(event);
    }
  }
};

/**
 * Saves tokens to localStorage
 * @param tokenData - Token data from OAuth response
 */
export const saveTokens = (tokenData: TokenData): void => {
  const updatedTokens: AuthTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) - (5 * 60 * 1000) : undefined,
    idToken: tokenData.id_token,
  };
  storeTokens(updatedTokens);
};

/**
 * Clears all tokens from storage
 */
export const clearTokens = (): void => {
  localStorage.removeItem('auth_tokens');
  updateAuthState(false);
};

/**
 * Checks if the user is authenticated with valid tokens
 * @returns - True if authenticated
 */
export const isAuthenticated = (): boolean => {
  const tokens = getStoredTokens();
  if (!tokens || !tokens.accessToken) {
    return false;
  }
  
  // Check if token is expired
  if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
    return false;
  }
  
  return true;
};

/**
 * Gets the current access token, refreshing if necessary
 * @returns - The access token
 */
export const getAccessToken = async (): Promise<string> => {
  const tokens = getStoredTokens();
  
  if (!tokens || !tokens.accessToken) {
    throw new Error('Authentication required');
  }
  
  // If the token will expire in less than 5 minutes, refresh it
  if (tokens.expiresAt && tokens.refreshToken && (Date.now() + 5 * 60 * 1000) >= tokens.expiresAt) {
    try {
      return await refreshToken(tokens.refreshToken);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Authentication required');
    }
  }
  
  return tokens.accessToken;
};

/**
 * Retrieve stored auth tokens
 * @returns The stored AuthTokens or null if not found
 */
export const getStoredTokens = (): AuthTokens | null => {
  const tokensJson = localStorage.getItem('auth_tokens');
  if (!tokensJson) {
    return null;
  }
  
  try {
    return JSON.parse(tokensJson);
  } catch (error) {
    console.error('Failed to parse stored tokens:', error);
    return null;
  }
};

/**
 * Store auth tokens in local storage
 * @param tokens AuthTokens to store
 */
export const storeTokens = (tokens: AuthTokens): void => {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
};

/**
 * Handles the logout process
 */
export const logout = (): void => {
  localStorage.removeItem('auth_tokens');
  updateAuthState(false);
};

// Alias for backward compatibility
export const authLogout = logout;

/**
 * Sets up periodic token refresh
 * @param interval - Refresh interval in milliseconds
 * @returns - The interval ID for clearing if needed
 */
export const setupTokenRefresh = (interval: number = 5 * 60 * 1000): NodeJS.Timeout => {
  // First check if we need to refresh immediately
  checkAndRefreshToken().catch(console.error);
  
  // Set up periodic checking
  return setInterval(checkAndRefreshToken, interval);
};

/**
 * Check and refresh the token if needed
 */
const checkAndRefreshToken = async (): Promise<void> => {
  const tokens = getStoredTokens();
  
  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    return;
  }
  
  // If the token will expire in less than 15 minutes, refresh it
  if (tokens.expiresAt && (Date.now() + 15 * 60 * 1000) >= tokens.expiresAt) {
    try {
      await refreshToken(tokens.refreshToken);
    } catch (error) {
      console.error('Failed to refresh token in background:', error);
    }
  }
};

// Expose refreshAccessToken function globally for service worker
if (typeof window !== 'undefined') {
  // Using a more compatible way to assign to window
  (window as any).refreshAccessToken = refreshAccessToken;
}

// Initialize auth state listener
if (typeof window !== 'undefined') {
  // Set initial auth state if needed
  const hasTokens = !!getStoredTokens();
  const authState = localStorage.getItem(AUTH_STATE_KEY);
  
  if (hasTokens && !authState) {
    updateAuthState(true);
  }
}