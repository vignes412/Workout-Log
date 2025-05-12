import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Enhanced Card component using Shadcn UI
type EnhancedCardProps = {
  title: string;
  children: React.ReactNode;
  imageUrl?: string;
  description?: string;
  footer?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const EnhancedCard = ({ title, children, imageUrl, description, footer, ...props }: EnhancedCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md" {...props}>
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-h5">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};

// Form input component with label
type FormInputProps = {
  label: string;
  id?: string;
  className?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  error?: string;
};

export const FormInput = ({ label, id, error, className, ...props }: FormInputProps) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={inputId} className="font-medium text-sm">
        {label}
      </Label>
      <Input 
        id={inputId}
        className={cn("", className)}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

// Exercise card component specifically for the exercise list
type ExerciseCardProps = {
  name: string;
  description: string;
  imageUrl: string;
  onClick?: () => void;
};

export const ExerciseCard = ({ name, description, imageUrl, onClick }: ExerciseCardProps) => {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200" onClick={onClick}>
      <div className="aspect-video w-full overflow-hidden">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-h6">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">Add to Workout</Button>
      </CardFooter>
    </Card>
  );
};

// Login form component for the login page
export const LoginForm = () => {
  return (
    <Card className="w-full max-w-md border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-h4 font-semibold">Workout Log</CardTitle>
        <CardDescription>Sign in to track your fitness journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormInput label="Email" type="email" placeholder="Enter your email" />
        <FormInput label="Password" type="password" placeholder="Enter your password" />
        <Button className="w-full mt-2">Sign In</Button>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Don't have an account? <a href="#" className="underline underline-offset-4 hover:text-primary">Sign up</a>
        </p>
      </CardFooter>
    </Card>
  );
};

// Dashboard layout component
type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="hidden w-[240px] flex-col bg-card border-r shadow-sm md:flex">
        <div className="flex h-[64px] items-center border-b px-6">
          <h1 className="text-lg font-semibold tracking-tight">Workout Log</h1>
        </div>
        <nav className="flex-1 overflow-auto py-6 px-3">
          <div className="grid gap-2">
            <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-primary bg-muted font-medium">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M5 8h8"/><path d="M5 12h8"/><path d="M5 16h8"/></svg>
              Workouts
            </a>
            <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
              Progress
            </a>
            <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
              Profile
            </a>
            <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Settings
            </a>
          </div>
        </nav>
        <div className="border-t p-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Sign Out
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm sm:px-6">
          <Button variant="outline" size="icon" className="md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="sr-only">Toggle notifications</span>
          </Button>
          <Button variant="ghost" size="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Example usage of the grid layout for exercise list
export const ExerciseGrid = ({ exercises }: { exercises: ExerciseCardProps[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((exercise, index) => (
        <ExerciseCard key={index} {...exercise} />
      ))}
    </div>
  );
};

// Workout exercise row component
type ExerciseRowProps = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export const ExerciseRow = ({ name, sets, reps, weight }: ExerciseRowProps) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <svg className="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8"/><path d="M3 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M15 18a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M6 6h8"/><path d="M3 6a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M15 6a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M6 12h8"/><path d="M3 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/><path d="M15 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/></svg>
        </div>
        <div>
          <h3 className="font-medium text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground">{sets} sets × {reps} reps</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">{weight} kg</span>
      </div>
    </div>
  );
};
