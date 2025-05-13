import React from 'react';
import { StatCard } from './StatCard';
import { WorkoutLogTable } from './WorkoutLogTable';
import { Button } from '@/components/ui/button';
import { PlusCircle, Dumbbell } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  // Mock data - in a real app, this would come from your state/store
  const stats = [
    {
      title: 'Total Workouts',
      value: 32,
      description: 'Since you started',
      icon: <PlusCircle className="w-4 h-4" />,
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: 'Weekly Average',
      value: '3.2',
      description: 'Sessions per week',
      icon: <PlusCircle className="w-4 h-4" />,
      trend: {
        value: 8,
        isPositive: true
      }
    },
    {
      title: 'Weight Lifted',
      value: '1,280 kg',
      description: 'Total this month',
      icon: <PlusCircle className="w-4 h-4" />,
      trend: {
        value: 5,
        isPositive: true
      }
    },
    {
      title: 'Personal Records',
      value: 12,
      description: '3 new this month',
      icon: <PlusCircle className="w-4 h-4" />,
      trend: {
        value: 15,
        isPositive: true
      }
    }
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
        <Button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-add-workout-modal'))}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-300 ease-in-out hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-lg px-4 py-2 flex items-center justify-center sm:justify-start group"
        >
          <Dumbbell className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
          Add Workout
        </Button>
      </div>

      {/* Stats Grid - Responsive with different column counts for different screen sizes */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>
      
      {/* Workout Log Table Card */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <WorkoutLogTable />
      </div>
    </div>
  );
};
