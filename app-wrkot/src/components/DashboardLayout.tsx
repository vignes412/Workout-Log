import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAppStore } from '@/store/appStore';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps): React.ReactElement => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { logout } = useAppStore();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 600; // Using the style guidelines breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {!isMobile && (
        <div
          className={`hidden md:block transition-all duration-base ease-in-out ${
            isSidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
          }`}
        >
          <SidebarNav isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        </div>
      )}      
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:px-6">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 hover:text-primary transition-button duration-base">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-r-primary/10">
                <SidebarNav isCollapsed={false} toggleSidebar={() => {}} />
              </SheetContent>
            </Sheet>
          )}
            {!isMobile && (
             <div className={`overflow-hidden transition-all duration-base ease-in-out flex items-center ${isSidebarCollapsed ? "max-w-0" : "max-w-[220px]"}`}>
               <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                 Workout Log
               </h1>
             </div>
          )}
          
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle variant="ghost" />
            
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-primary/10 hover:text-primary transition-button duration-base">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse-soft"></span>
              <span className="sr-only">Notifications</span>
            </Button>
            
            <div className="hidden md:flex border-l h-6 mx-1.5 border-border/50"></div>
            
            <div className="hidden md:flex items-center gap-3">
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};
