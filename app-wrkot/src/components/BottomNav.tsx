import React from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { ViewType } from '@/store/appStore';
import { Home, Dumbbell, CalendarClock, BarChart3, Settings } from 'lucide-react';

interface BottomNavItemProps {
  icon: React.ReactNode;
  label: string;
  view: ViewType;
  isActive?: boolean;
  onClick: () => void;
}

const BottomNavItem: React.FC<BottomNavItemProps> = ({ 
  icon, 
  label, 
  isActive,
  onClick 
}) => {
  return (
    <button 
      className={cn(
        "flex flex-col items-center justify-center flex-1 px-2 py-1 focus:outline-none transition-colors",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "p-1.5 rounded-full transition-all",
        isActive ? "bg-primary/10 scale-110" : "hover:bg-background/60"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-xs mt-1 font-medium transition-all",
        isActive && "scale-105"
      )}>{label}</span>
    </button>
  );
};

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  
  // Only show bottom nav in the browser, not during SSR
  if (typeof window === 'undefined') return null;
  // Most important views for mobile users
  const navItems = [
    { view: 'dashboard' as ViewType, label: 'Home', icon: <Home className="h-5 w-5" /> },
    { view: 'workouts' as ViewType, label: 'Workouts', icon: <Dumbbell className="h-5 w-5" /> },
    { view: 'schedule' as ViewType, label: 'Schedule', icon: <CalendarClock className="h-5 w-5" /> },
    { view: 'stats' as ViewType, label: 'Stats', icon: <BarChart3 className="h-5 w-5" /> },
    { view: 'settings' as ViewType, label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border z-40 flex justify-around py-1.5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] bottom-nav-container">
      {navItems.map((item) => (
        <BottomNavItem
          key={item.view}
          icon={item.icon}
          label={item.label}
          view={item.view}
          isActive={currentView === item.view}
          onClick={() => setCurrentView(item.view)}
        />
      ))}
    </div>
  );
};
