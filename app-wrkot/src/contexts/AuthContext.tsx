import React, { useState, useEffect, ReactNode } from 'react';
import { googleConfig } from '../config/google.config';
import { AuthContext, User, AuthContextType } from './useAuth';

// Define GoogleAuth interface
interface GoogleUser {
  getBasicProfile: () => {
    getId: () => string;
    getName: () => string;
    getEmail: () => string;
    getImageUrl: () => string;
  };
  getAuthResponse: (includeAuthorizationData?: boolean) => {
    access_token: string;
    id_token: string;
    scope: string;
    expires_in: number;
    first_issued_at: number;
    expires_at: number;
  };
}

interface GoogleAuth {
  signIn: (options?: object) => Promise<GoogleUser>;
  signOut: () => Promise<void>;
  isSignedIn: {
    get: () => boolean;
  };
  currentUser: {
    get: () => GoogleUser;
  };
}

// Define the auth state type
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  googleAuth: GoogleAuth | null;
}

// Define props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State for authentication
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    googleAuth: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Auth on component mount
  useEffect(() => {
    const loadGoogleAuth = async () => {
      try {
        // Load the Google API client
        const gapi = await import('gapi-script').then(x => x.gapi);
        
        // Load the auth2 library
        await new Promise<void>((resolve) => {
          gapi.load('client:auth2', resolve);
        });

        // Initialize the client
        await gapi.client.init({
          clientId: googleConfig.auth.clientId,
          scope: [
            ...googleConfig.sheets.scopes,
            ...googleConfig.drive.scopes,
            'profile',
            'email'
          ].join(' '),
          ux_mode: 'redirect',
          redirect_uri: googleConfig.auth.redirectUri,
        });

        // Get the auth instance
        const authInstance = gapi.auth2.getAuthInstance();

        // Check if the user is already signed in
        if (authInstance.isSignedIn.get()) {
          const googleUser = authInstance.currentUser.get();
          const profile = googleUser.getBasicProfile();
          const authResponse = googleUser.getAuthResponse(true);
          
          setAuthState({
            isAuthenticated: true,
            user: {
              id: profile.getId(),
              name: profile.getName(),
              email: profile.getEmail(),
              picture: profile.getImageUrl()
            },
            token: authResponse.access_token,
            googleAuth: authInstance
          });
        } else {
          setAuthState(prev => ({ ...prev, googleAuth: authInstance }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Google Auth:', err);
        setError('Failed to initialize authentication');
        setLoading(false);
      }
    };

    loadGoogleAuth();
  }, []);

  // Handle login
  const login = async () => {
    setLoading(true);
    try {
      if (!authState.googleAuth) {
        throw new Error('Google Auth not initialized');
      }

      // Trigger the Google sign-in flow
      const googleUser = await authState.googleAuth.signIn({
        scope: [
          ...googleConfig.sheets.scopes, 
          ...googleConfig.drive.scopes,
          'profile',
          'email'
        ].join(' ')
      });
      
      const profile = googleUser.getBasicProfile();
      const authResponse = googleUser.getAuthResponse(true);

      setAuthState({
        isAuthenticated: true,
        user: {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          picture: profile.getImageUrl()
        },
        token: authResponse.access_token,
        googleAuth: authState.googleAuth
      });
      
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const logout = async () => {
    setLoading(true);
    try {
      if (authState.googleAuth) {
        await authState.googleAuth.signOut();
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        googleAuth: authState.googleAuth
      });
      
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value: AuthContextType = {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token, // Pass the token to the context value
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
