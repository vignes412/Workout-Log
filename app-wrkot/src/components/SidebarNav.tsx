import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, BarChart3, User, Settings, Dumbbell, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/dashboard/schedule', label: 'Schedule', icon: CalendarClock },
  { href: '/dashboard/stats', label: 'Statistics', icon: BarChart3 },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav({ className, isCollapsed, toggleSidebar }: SidebarNavProps) {
  return (
    <div className={cn(
      "relative h-full bg-background text-card-foreground border-r border-r-border/40 transition-all duration-base backdrop-blur-md",
      isCollapsed ? "w-[80px]" : "w-[280px]",
      className
    )}>
      <div className={cn("flex h-full max-h-screen flex-col", isCollapsed ? "items-center" : "")}>
        <div className={cn(
          "flex h-[64px] items-center border-b border-b-border/40 px-4 sticky top-0 z-20 bg-background/70 backdrop-blur-md",
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
        <div className={cn("flex-1 overflow-y-auto py-6", isCollapsed ? "px-2" : "px-4")}>
          <nav className="grid items-start gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-base",
                    "hover:bg-primary/10 hover:text-primary",
                    isActive 
                      ? "bg-primary/15 text-primary font-medium shadow-sm" 
                      : "text-muted-foreground",
                    isCollapsed && "justify-center"
                  )
                }
              >
                <item.icon className={cn("h-5 w-5", isCollapsed ? "m-0" : "")} />
                {!isCollapsed && (
                  <span className="transition-opacity duration-base">{item.label}</span>
                )}
                {isCollapsed && <span className="sr-only">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>        <div className={cn(
          "border-t border-t-border/40 p-4 flex justify-center",
          isCollapsed ? "px-2" : "px-4"
        )}>          <Button 
            variant={isCollapsed ? "outline" : "gradient"}
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "transition-all duration-base",
              isCollapsed 
                ? "w-10 h-10 p-0 rounded-full hover:bg-primary/10 hover:text-primary border-primary/20" 
                : "w-full justify-start gap-2 shadow-sm hover:shadow-md rounded-lg"
            )}
          >
            {isCollapsed ? (
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            ) : (
              <>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Sign Out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
