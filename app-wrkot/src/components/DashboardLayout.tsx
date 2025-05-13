import React, { useState, useEffect } from 'react';
import { SidebarNav } from './SidebarNav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, LogOut, Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAppStore } from '@/store/appStore';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps): React.ReactElement => {
  const { logout, isSidebarCollapsed, toggleSidebar, setIsSidebarCollapsed, currentView } = useAppStore();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };

    const handleScroll = () => {
      if (!isMobileView) return;
      
      const st = window.scrollY || document.documentElement.scrollTop;
      if (st > lastScrollTop && st > 60) {
        setIsHeaderHidden(true);
      } else if (st < lastScrollTop || st < 10) {
        setIsHeaderHidden(false);
      }
      setLastScrollTop(st);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [setIsSidebarCollapsed, isMobileView, lastScrollTop]);

  const handleOpenAddWorkoutModal = () => {
    const event = new CustomEvent('open-add-workout-modal');
    window.dispatchEvent(event);
  };
  const shouldShowFAB = ['dashboard', 'workouts'].includes(currentView);

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full bg-background text-foreground">
      {shouldShowFAB && (
        <FloatingActionButton 
          icon={<Plus className="h-6 w-6" />}
          onClick={handleOpenAddWorkoutModal}
          tooltip="Add Workout"
          aria-label="Add new workout"
          position={isMobileView ? "bottom-center" : "bottom-right"}
          className="bg-primary text-primary-foreground hover:bg-primary/90 z-50"
        />
      )}
      
      <BottomNav />
      
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out hidden md:block",
          isSidebarCollapsed ? 'w-[var(--sidebar-collapsed-width,80px)]' : 'w-[var(--sidebar-width,280px)]'
        )}
      >
        <SidebarNav isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      </div>
      
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 ease-in-out",
        "md:ml-[var(--sidebar-width,280px)]",
        isSidebarCollapsed && "md:ml-[var(--sidebar-collapsed-width,80px)]"
      )}>
        <header className={cn(
          "sticky top-0 z-30 flex h-[var(--header-height,64px)] items-center gap-4 border-b bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:px-6 transition-transform duration-300",
          isHeaderHidden && isMobileView ? '-translate-y-full' : 'translate-y-0'
        )}>
          {isMobileView && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-button duration-base">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r-primary/10 w-[var(--sidebar-width,280px)] md:hidden">
                <SidebarNav isCollapsed={false} toggleSidebar={toggleSidebar} /> 
              </SheetContent>
            </Sheet>
          )}
          
          {!isMobileView && (
             <div className={cn(
                "overflow-hidden transition-all duration-base ease-in-out flex items-center",
                isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100"
             )}>
               <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                 Workout Log
               </h1>
             </div>
          )}
          
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="ghost" />
            
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-primary/10 hover:text-primary transition-button duration-base">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse-soft"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            <div className="hidden sm:flex border-l h-6 mx-1.5 border-border/50"></div>
            
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-sm">
                <span className="text-xs font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">John Doe</p>
                <p className="text-xs text-muted-foreground">Premium</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-button duration-base"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-6 lg:p-8 pb-[calc(var(--bottom-nav-height,64px)+1rem)] md:pb-8">
          <div className="mx-auto max-w-full w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Helper function cn - assuming it's defined elsewhere, e.g., in lib/utils
// If not, you'll need to define it:
// export function cn(...inputs: ClassValue[]) {
//  return twMerge(clsx(inputs))
// }
// Make sure to install clsx and tailwind-merge if you haven't:
// npm install clsx tailwind-merge
// yarn add clsx tailwind-merge
// pnpm add clsx tailwind-merge
