import React, { useEffect } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { useAppStore, ViewType } from './store/appStore';
import { LoginPage } from './components/LoginPage';
import { Button } from './components/ui/button';

// Main App Component
export const App: React.FC = () => {
  const { initAuth } = useAppStore();
  
  // Initialize auth on app mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  
  return <AppContent />;
};

// App Content Component with authentication
const AppContent: React.FC = () => {
  // Use the centralized store
  const { 
    isAuthenticated, 
    user, 
    logout, 
    authLoading, 
    currentView, 
    setCurrentView,
    themeMode
  } = useAppStore();
  
  // Header component with theme toggle
  const Header = () => {
    return (
      <header className="header bg-primary text-primary-foreground flex items-center justify-between px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold">Workout Log</h1>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-border" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-sm hidden md:inline">{user.name}</span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>
    );
  };

  // Navigation component
  const Navigation = () => {
    const navItems = [
      { name: 'Dashboard', view: 'dashboard' },
      { name: 'Exercises', view: 'exercises' },
      { name: 'Workout', view: 'workout' },
      { name: 'Progress', view: 'progress' },
      { name: 'Settings', view: 'settings' },
    ];

    return (
      <nav>
        <ul className="space-y-2 mt-4">
          {navItems.map((item) => (
            <li key={item.view}>
              <Button
                variant={currentView === item.view ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentView(item.view as ViewType)}
              >
                {item.name}
              </Button>
            </li>
          ))}
          <li className="mt-8">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              Logout
            </Button>
          </li>
        </ul>
      </nav>
    );
  };

  // Dashboard view
  const DashboardView = () => (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <p>Dashboard content will go here</p>
    </section>
  );

  // Exercises view
  const ExercisesView = () => (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6">Exercise Library</h2>
      <p>Exercise content will go here</p>
    </section>
  );

  // Workout view
  const WorkoutView = () => (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6">Current Workout</h2>
      <p>Workout content will go here</p>
    </section>
  );

  // Progress view
  const ProgressView = () => (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Progress</h2>
      <p>Progress content will go here</p>
    </section>
  );

  // Settings view
  const SettingsView = () => (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-xl font-bold mb-4">App Preferences</h3>
        <div className="flex justify-between items-center">
          <span>Dark Mode</span>
          <ThemeToggle />
        </div>
      </div>
    </section>
  );

  // Render current view based on state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'exercises':
        return <ExercisesView />;
      case 'workout':
        return <WorkoutView />;
      case 'progress':
        return <ProgressView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Main layout
  const AppLayout = () => (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] grid-rows-[auto_1fr]">
      <header className="col-span-full">
        <Header />
      </header>
      <aside className="hidden md:block bg-card border-r border-border p-4">
        <Navigation />
      </aside>
      <main className="overflow-auto">
        {renderCurrentView()}
      </main>
    </div>
  );
  
  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className={themeMode}>
        <LoginPage />
      </div>
    );
  }

  // Return authenticated app
  return (
    <div className={themeMode}>
      <AppLayout />
    </div>
  );
};