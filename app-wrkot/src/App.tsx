import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { LoginPage } from './components/LoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAHandler } from './components/PWAHandler';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './views/DashboardPage';
import SettingsPage from './views/SettingsPage';

// Main App Component
export const App: React.FC = () => {
  const { initAuth } = useAppStore();
  
  // Initialize auth on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  return (
    <>
      <OfflineIndicator />
      <PWAHandler />
      <Router>
        <AppContent />
      </Router>
    </>
  );
};

// App Content Component with authentication
const AppContent: React.FC = () => {
  // Use the centralized store
  const {
    isAuthenticated,
    authLoading
  } = useAppStore();

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

  // Render app content based on auth state
  return (
    <>
      {isAuthenticated ? (
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      ) : (
        <LoginPage />
      )}
    </>
  );
};