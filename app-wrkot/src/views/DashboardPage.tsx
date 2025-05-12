import React from 'react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { RecentWorkouts } from '@/components/dashboard/RecentWorkouts';
import { DashboardLayout } from '@/components/DashboardLayout';
import { SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { GradientCard } from '@/components/ui/glass-card';
import { PlusCircle, LineChart, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <StaggerContainer className="flex flex-col gap-8">
        <StaggerItem>
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Dashboard</h2>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your fitness journey.</p>
          </div>
          <SlideUp>
            <DashboardOverview />
          </SlideUp>
        </StaggerItem>
        
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
              <div className="bg-card/50 backdrop-blur-md rounded-lg border border-border/30 p-5 transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 flex items-center gap-4">
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
      </StaggerContainer>
    </DashboardLayout>
  );
};

export default DashboardPage;
