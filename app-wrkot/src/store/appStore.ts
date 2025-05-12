import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { googleConfig } from '../config/google.config';

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

// Define View types
export type ViewType = 'dashboard' | 'exercises' | 'workout' | 'progress' | 'settings' | 'login';

// Define GoogleAuth interfaces
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

// Define AppStore state
interface AppState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  googleAuth: GoogleAuth | null;
  authLoading: boolean;
  authError: string | null;
  
  // View state
  currentView: ViewType;
  
  // Theme state
  themeMode: 'light' | 'dark';
  
  // Auth actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  
  // View actions
  setCurrentView: (view: ViewType) => void;
    // Theme actions
  toggleTheme: () => void;
  setThemeMode: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      isAuthenticated: false,
      user: null,
      token: null,
      googleAuth: null,
      authLoading: false,
      authError: null,
      
      // View state
      currentView: 'dashboard',
      
      // Theme state
      themeMode: 
        typeof window !== 'undefined' && window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      
      // Auth actions
      initAuth: async () => {
        set({ authLoading: true });
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
            
            set({
              isAuthenticated: true,
              user: {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                picture: profile.getImageUrl()
              },
              token: authResponse.access_token,
              googleAuth: authInstance,
              authLoading: false,
              authError: null
            });
          } else {
            set({ googleAuth: authInstance, authLoading: false });
          }
        } catch (err) {
          console.error('Error initializing Google Auth:', err);
          set({ 
            authError: 'Failed to initialize authentication',
            authLoading: false
          });
        }
      },
      
      login: async () => {
        set({ authLoading: true });
        try {
          const { googleAuth } = get();
          if (!googleAuth) {
            throw new Error('Google Auth not initialized');
          }

          // Trigger the Google sign-in flow
          const googleUser = await googleAuth.signIn({
            scope: [
              ...googleConfig.sheets.scopes, 
              ...googleConfig.drive.scopes,
              'profile',
              'email'
            ].join(' ')
          });
          
          const profile = googleUser.getBasicProfile();
          const authResponse = googleUser.getAuthResponse(true);

          set({
            isAuthenticated: true,
            user: {
              id: profile.getId(),
              name: profile.getName(),
              email: profile.getEmail(),
              picture: profile.getImageUrl()
            },
            token: authResponse.access_token,
            authLoading: false,
            authError: null
          });
        } catch (err) {
          console.error('Login error:', err);
          set({ 
            authError: 'Login failed. Please try again.',
            authLoading: false
          });
        }
      },
      
      logout: async () => {
        set({ authLoading: true });
        try {
          const { googleAuth } = get();
          if (googleAuth) {
            await googleAuth.signOut();
          }
          
          set({
            isAuthenticated: false,
            user: null,
            token: null,
            authLoading: false,
            authError: null
          });
        } catch (err) {
          console.error('Logout error:', err);
          set({ 
            authError: 'Logout failed. Please try again.',
            authLoading: false
          });
        }
      },
      
      // View actions
      setCurrentView: (view: ViewType) => {
        set({ currentView: view });
      },
        // Theme actions
      toggleTheme: () => {
        const newTheme = get().themeMode === 'light' ? 'dark' : 'light';
        set({ themeMode: newTheme });
        
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(newTheme);
          localStorage.setItem('theme', newTheme);
        }
      },
      
      // Directly set theme mode
      setThemeMode: (theme: 'light' | 'dark') => {
        set({ themeMode: theme });
        
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme);
          localStorage.setItem('theme', theme);
        }
      }
    }),
    {
      name: 'workout-app-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        currentView: state.currentView
      })
    }
  )
);
