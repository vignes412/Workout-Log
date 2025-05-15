import React, { useEffect, useState } from 'react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecentWorkouts } from '@/components/dashboard/RecentWorkouts';
import { ActiveWorkoutCard } from '@/components/dashboard/ActiveWorkoutCard';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { GradientCard } from '@/components/ui/glass-card';
import { PlusCircle, LineChart, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useExercisesStore } from '@/store/exercisesStore';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { useWorkoutTemplateStore } from '@/store/workoutTemplateStore';
import { WorkoutLogTable } from '@/components/dashboard/WorkoutLogTable';
import { WorkoutSummaryTable } from '@/components/dashboard/WorkoutSummaryTable';
import { Card, CardContent } from '@/components/ui/card';
import { AddWorkoutLogModal } from '@/components/dashboard/AddWorkoutLogModal';
import { WorkoutCharts } from '@/components/charts';

// This will render content based on currentView
const ViewContent: React.FC = () => {
  const { currentView } = useAppStore();

  // Return different content based on currentView
  switch (currentView) {
    case 'dashboard':
      return <DashboardMainContent />;
    case 'workouts':
      return <WorkoutsContent />;
    case 'schedule':
      return <ScheduleContent />;
    case 'stats':
      return <StatsContent />;
    case 'profile':
      return <ProfileContent />;
    case 'settings':
      return <SettingsContent />;
    default:
      return <DashboardMainContent />;
  }
};

// Original dashboard content moved to its own component
const DashboardMainContent: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { workoutLogs } = useWorkoutLogStore();
  const { activeWorkout } = useWorkoutTemplateStore();

  useEffect(() => {
    const handleOpenWorkoutModal = () => setIsAddModalOpen(true);
    window.addEventListener('open-add-workout-modal', handleOpenWorkoutModal);
    
    return () => {
      window.removeEventListener('open-add-workout-modal', handleOpenWorkoutModal);
    };
  }, []);

  return (    
    <StaggerContainer className="flex flex-col gap-6 md:gap-8">
      <AddWorkoutLogModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <StaggerItem>
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your fitness journey.</p>
        </div>
        <SlideUp>
          <DashboardOverview />
        </SlideUp>
      </StaggerItem>
      
      {/* Active Workout Card - only shows when there is an active workout */}
      {activeWorkout && (
        <StaggerItem>
          <SlideUp delay={0.05}>
            <ActiveWorkoutCard />
          </SlideUp>
        </StaggerItem>
      )}
      
      <StaggerItem>
        <div className="grid gap-6 md:grid-cols-2">
          <SlideUp delay={0.1}>
            <RecentWorkouts />
          </SlideUp>
          
          <SlideUp delay={0.2}>
            <GradientCard 
              title="Track Your Progress"
              description="Set goals, track your measurements, and watch your progress over time."
              icon={<TrendingUp className="h-6 w-6" />}
              className="h-[400px] flex flex-col items-center justify-center text-center space-y-4"
            >
              <Button 
                className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                variant="ghost"
              >
                Get Started
              </Button>
            </GradientCard>
          </SlideUp>
        </div>
      </StaggerItem>

      <StaggerItem>
        <h3 className="text-2xl font-semibold mb-4 mt-2">Quick Actions</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <SlideUp delay={0.3}>
            <div 
              className="bg-card/50 backdrop-blur-md rounded-lg border border-border/30 p-5 transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 flex items-center gap-4 cursor-pointer"
              onClick={() => setIsAddModalOpen(true)}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">New Workout</h4>
                <p className="text-sm text-muted-foreground">Start tracking now</p>
              </div>
            </div>
          </SlideUp>
          
          <SlideUp delay={0.4}>
            <div className="bg-card/50 backdrop-blur-md rounded-lg border border-border/30 p-5 transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-accent-light flex items-center justify-center text-accent">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Analytics</h4>
                <p className="text-sm text-muted-foreground">View detailed stats</p>
              </div>
            </div>
          </SlideUp>
          
          <SlideUp delay={0.5}>
            <div className="bg-card/50 backdrop-blur-md rounded-lg border border-border/30 p-5 transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-foreground">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Set Goals</h4>
                <p className="text-sm text-muted-foreground">Define your targets</p>
              </div>
            </div>
          </SlideUp>
        </div>
      </StaggerItem>

      <StaggerItem>
        <WorkoutCharts workoutLogs={workoutLogs} />
      </StaggerItem>

      <StaggerItem>
        <h3 className="text-2xl font-semibold mb-4 mt-2">Workout Summary</h3>
        <div className="w-full max-w-full overflow-hidden stats-container">
          <div className="mobile-optimized rounded-lg">
            <WorkoutSummaryTable />
          </div>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
};

// Workouts view
const WorkoutsContent: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenWorkoutModal = () => setIsAddModalOpen(true);
    window.addEventListener('open-add-workout-modal', handleOpenWorkoutModal);
    
    return () => {
      window.removeEventListener('open-add-workout-modal', handleOpenWorkoutModal);
    };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Workouts</h2>
      <p className="text-muted-foreground">Track and manage your workout history</p>
      <AddWorkoutLogModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <WorkoutLogTable />
    </div>
  );
};

// Schedule view
const ScheduleContent: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Schedule</h2>
    <p className="text-muted-foreground">Plan your upcoming workout sessions</p>
    <Card>
      <CardContent className="p-6">
        <p>Schedule feature coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

// Stats view
const StatsContent: React.FC = () => {
  const { workoutLogs } = useWorkoutLogStore();
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Statistics</h2>
      <p className="text-muted-foreground">View detailed analytics of your progress</p>
      <WorkoutCharts workoutLogs={workoutLogs} />
    </div>
  );
};

// Profile view
const ProfileContent: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Profile</h2>
    <p className="text-muted-foreground">Manage your user profile and preferences</p>
    <Card>
      <CardContent className="p-6">
        <p>Profile feature coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

// Settings view
const SettingsContent: React.FC = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Settings</h2>
    <p className="text-muted-foreground">Configure your app settings</p>
    <Card>
      <CardContent className="p-6">
        <p>Settings feature content goes here...</p>
      </CardContent>
    </Card>
  </div>
);

// The main DashboardPage component that wraps content in the layout
const DashboardPage: React.FC = () => {
  const { fetchExercises } = useExercisesStore();

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return (
    <DashboardLayout>
      <ViewContent />
    </DashboardLayout>
  );
};

export default DashboardPage;
