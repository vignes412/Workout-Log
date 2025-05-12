import React from 'react';
import { GoogleLoginButton } from './GoogleLoginButton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/useTheme';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LoginPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Theme toggle in corner */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 rounded-full hover:bg-muted"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      <Card className="w-full max-w-md border shadow-lg animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-semibold tracking-tight">
            Welcome to Workout Log
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to track your fitness journey
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 pb-2 space-y-4">
          <GoogleLoginButton className="w-full h-12 text-base" />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 pb-6">
          <div className="mt-2 px-2 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
