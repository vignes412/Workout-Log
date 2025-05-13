import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { LoginPage } from './components/LoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAHandler } from './components/PWAHandler';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import DashboardPage from './views/DashboardPage';
import SettingsPage from './views/SettingsPage';

// Main App Component
export const App: React.FC = () => {
  const { initAuth, isAuthenticated, authLoading,currentView } = useAppStore();
  
  // Initialize auth on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  // Show auth loading state
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <PWAHandler />
      <PWAInstallPrompt />
      {isAuthenticated ? (
      // Use switch case to determine which view to render based on currentView
      (() => {
        switch (currentView) {
        case 'dashboard':
          return <DashboardPage />;
        case 'workouts':
          return <DashboardPage/>;
        case 'exercises':
          return <DashboardPage />;
        case 'stats':
          return <DashboardPage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <DashboardPage />;
        }
      })()
      ) : (
      <LoginPage />
      )}
    </>
  );
};