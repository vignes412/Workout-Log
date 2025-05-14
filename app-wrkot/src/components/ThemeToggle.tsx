import React from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/useTheme';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  variant = 'outline' 
}) => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "rounded-full transition-all hover:scale-110 focus-visible:scale-110 hover:bg-primary/10 hover:text-primary", 
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5 overflow-hidden">
        <Sun className={cn(
          "h-5 w-5 absolute top-0 left-0 transition-all duration-300",
          theme === 'light' 
            ? "opacity-0 rotate-90 scale-0" 
            : "opacity-100 rotate-0 scale-100"
        )} />
        <Moon className={cn(
          "h-5 w-5 absolute top-0 left-0 transition-all duration-300",
          theme === 'light' 
            ? "opacity-100 rotate-0 scale-100" 
            : "opacity-0 rotate-90 scale-0"
        )} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
