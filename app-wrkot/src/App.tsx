import React, { useEffect, Suspense } from 'react'; // Added Suspense
import { useAppStore } from './store/appStore';
import { LoginPage } from './components/LoginPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAHandler } from './components/PWAHandler';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Lazy load page components
const DashboardPage = React.lazy(() => import('./views/DashboardPage'));
const SettingsPage = React.lazy(() => import('./views/SettingsPage'));
const ExerciseDBPage = React.lazy(() => import('./views/ExerciseDBPage'));
const WorkoutTemplateBuilderPage = React.lazy(() => import('./views/WorkoutTemplateBuilderPage'));
const ActiveWorkoutPage = React.lazy(() => import('./views/ActiveWorkoutPage'));

// Basic loading spinner component (you can customize this)
const PageLoader: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

// Main App Component
export const App: React.FC = () => {
  const { initAuth, isAuthenticated, authLoading, currentView } = useAppStore();
  
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
        <Suspense fallback={<PageLoader />}> { /* Wrap routes in Suspense */}          {(() => {          switch (currentView) {
              case 'dashboard':
                return <DashboardPage />;
              case 'workouts':
                return <ExerciseDBPage />;
              case 'exercises':
                return <ExerciseDBPage />;
              case 'templates':
                return <WorkoutTemplateBuilderPage />;
              case 'workout':
                return <ActiveWorkoutPage />;
              case 'stats':
                return <DashboardPage />;
              case 'settings':
                return <SettingsPage />;
              default:
                return <DashboardPage />;
            }
          })()}
        </Suspense>
      ) : (
        <LoginPage />
      )}
    </>
  );
};