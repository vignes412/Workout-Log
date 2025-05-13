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
        "flex flex-col items-center justify-center flex-1 px-1 py-1.5 sm:px-2 focus:outline-none transition-all duration-200 ease-in-out transform active:scale-95",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
      aria-label={label}
    >
      <div className={cn(
        "p-1.5 rounded-full transition-all duration-200 ease-in-out",
        isActive ? "bg-primary/10 scale-110" : "hover:bg-muted/50"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[0.6rem] sm:text-xs mt-0.5 font-medium transition-all duration-200 ease-in-out truncate max-w-[4em] sm:max-w-none",
        isActive ? "scale-105 text-primary" : "text-muted-foreground"
      )}>{label}</span>
    </button>
  );
};

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  
  if (typeof window === 'undefined') return null;

  const navItems = [
    { view: 'dashboard' as ViewType, label: 'Home', icon: <Home className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { view: 'workouts' as ViewType, label: 'Workouts', icon: <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { view: 'schedule' as ViewType, label: 'Schedule', icon: <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { view: 'stats' as ViewType, label: 'Stats', icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { view: 'settings' as ViewType, label: 'Settings', icon: <Settings className="h-5 w-5 sm:h-6 sm:w-6" /> },
  ];
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/60 z-40 flex justify-around items-center h-[var(--bottom-nav-height,60px)] shadow-top transition-transform duration-300 ease-in-out"
         style={{ contain: 'layout style paint' }} 
    >
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
