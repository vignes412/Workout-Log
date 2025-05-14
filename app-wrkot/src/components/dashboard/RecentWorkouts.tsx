import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, ArrowRight } from 'lucide-react';

// Types
interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: number;
  duration: string;
}

export const RecentWorkouts: React.FC = () => {
  // Mock data - in a real app, this would come from your state/store
  const recentWorkouts: Workout[] = [
    {
      id: '1',
      date: '2025-05-10',
      name: 'Upper Body Strength',
      exercises: 5,
      duration: '45 min'
    },
    {
      id: '2',
      date: '2025-05-08',
      name: 'Leg Day',
      exercises: 6,
      duration: '50 min'
    },
    {
      id: '3',
      date: '2025-05-06',
      name: 'Full Body Workout',
      exercises: 8,
      duration: '60 min'
    }
  ];

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };  return (
    <Card 
      variant="glass" 
      hover="scale"
      animate
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Recent Workouts</CardTitle>
            <CardDescription>
              Your latest training sessions
            </CardDescription>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-white shadow-sm">
            <Dumbbell className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {recentWorkouts.map((workout, index) => (
            <div 
              key={workout.id} 
              className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all duration-base"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent shadow-sm">
                  <span className="font-medium text-sm">{formatDate(workout.date)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none mb-1.5">{workout.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M5 8h8"/><path d="M5 12h8"/><path d="M5 16h8"/>
                      </svg>
                      {workout.exercises} exercises
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {workout.duration}
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-button duration-base">
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">View workout details</span>
              </Button>
            </div>
          ))}
        </div>        <div className="p-4">
          <Button variant="gradient" className="w-full group rounded-lg shadow-sm hover:shadow-md transition-button duration-base">
            <span>View all workouts</span>
            <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1 animate-bounce-soft" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
