import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, BarChart3, User, Settings, Dumbbell, CalendarClock, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { ViewType } from '@/store/appStore';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  { view: 'dashboard' as ViewType, label: 'Dashboard', icon: Home },
  { view: 'workouts' as ViewType, label: 'Workouts', icon: Dumbbell },
  { view: 'schedule' as ViewType, label: 'Schedule', icon: CalendarClock },
  { view: 'stats' as ViewType, label: 'Statistics', icon: BarChart3 },
  { view: 'profile' as ViewType, label: 'Profile', icon: User },
  { view: 'settings' as ViewType, label: 'Settings', icon: Settings },
];

export function SidebarNav({ className, isCollapsed, toggleSidebar }: SidebarNavProps) {
  const { setCurrentView, currentView, logout } = useAppStore();

  return (
    <div className={cn(
      "relative h-full bg-background text-card-foreground border-r border-r-border/40 transition-all duration-base backdrop-blur-md flex flex-col",
      isCollapsed ? "w-[var(--sidebar-collapsed-width,80px)]" : "w-[var(--sidebar-width,280px)]",
      className
    )}>
      <div className={cn(
        "flex h-[var(--header-height,64px)] items-center border-b border-b-border/40 px-3 sm:px-4 sticky top-0 z-20 bg-background/70 backdrop-blur-md",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <h1 className="text-lg font-semibold tracking-tight overflow-hidden text-ellipsis whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Workout Log
          </h1>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="rounded-full hover:bg-primary/10 hover:text-primary transition-button duration-base"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 sm:py-6 px-2 sm:px-4 space-y-1 sm:space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            onClick={() => setCurrentView(item.view)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-base w-full justify-start",
              "hover:bg-primary/10 hover:text-primary",
              currentView === item.view 
                ? "bg-primary/15 text-primary font-medium shadow-sm" 
                : "text-muted-foreground",
              isCollapsed && "justify-center h-11 w-11 p-0" 
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed ? "m-0" : "")} />
            {!isCollapsed && (
              <span className="transition-opacity duration-base whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
            )}
            {isCollapsed && <span className="sr-only">{item.label}</span>}
          </Button>
        ))}
      </nav>
      <div className={cn(
        "border-t border-t-border/40 p-3 sm:p-4 mt-auto sticky bottom-0 bg-background/70 backdrop-blur-md",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <Button 
          variant={isCollapsed ? "ghost" : "outline"}
          size={isCollapsed ? "icon" : "default"}
          className={cn(
            "transition-all duration-base w-full",
            isCollapsed 
              ? "h-10 w-10 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive border-destructive/20" 
              : "justify-start gap-2 shadow-sm hover:shadow-md rounded-lg hover:bg-destructive/10 hover:text-destructive border-destructive/30 text-destructive-foreground"
          )}
          onClick={logout}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", isCollapsed ? "" : "mr-2")} />
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Sign Out</span>
          )}
          {isCollapsed && <span className="sr-only">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
