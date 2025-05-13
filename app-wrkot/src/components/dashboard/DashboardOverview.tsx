import React, { useMemo } from 'react';
import { StatCard } from './StatCard';
import { WorkoutLogTable } from './WorkoutLogTable';
import { Button } from '@/components/ui/button';
import { PlusCircle, Dumbbell, TrendingUp, BarChart2, Award } from 'lucide-react';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import {
  getTotalWorkouts,
  getWeeklyAverageWorkouts,
  getTotalWeightLifted,
  getPersonalRecordsCount,
  getNewPRsThisMonth
} from '@/utils/computeDailyMetrics';

export const DashboardOverview: React.FC = () => {
  const { workoutLogs } = useWorkoutLogStore();

  const totalWorkouts = useMemo(() => getTotalWorkouts(workoutLogs), [workoutLogs]);
  const weeklyAverage = useMemo(() => getWeeklyAverageWorkouts(workoutLogs), [workoutLogs]);
  const totalWeightThisMonth = useMemo(() => getTotalWeightLifted(workoutLogs, 'month'), [workoutLogs]);
  const personalRecords = useMemo(() => getPersonalRecordsCount(workoutLogs), [workoutLogs]);
  const newPRsThisMonth = useMemo(() => getNewPRsThisMonth(workoutLogs), [workoutLogs]);

  const stats = [
    {
      title: 'Total Workouts',
      value: totalWorkouts,
      description: 'Since you started',
      icon: <BarChart2 className="w-4 h-4 text-blue-500" />,
      trend: {
        value: 0,
        isPositive: true
      }
    },
    {
      title: 'Weekly Average',
      value: weeklyAverage.toString(),
      description: 'Sessions per week',
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      trend: {
        value: 0,
        isPositive: true
      }
    },
    {
      title: 'Weight Lifted',
      value: `${totalWeightThisMonth.toLocaleString()} kg`,
      description: 'Total this month',
      icon: <Dumbbell className="w-4 h-4 text-red-500" />,
      trend: {
        value: 0,
        isPositive: true
      }
    },
    {
      title: 'Personal Records',
      value: personalRecords,
      description: `${newPRsThisMonth} new this month`,
      icon: <Award className="w-4 h-4 text-yellow-500" />,
      trend: {
        value: newPRsThisMonth > 0 ? newPRsThisMonth : 0,
        isPositive: newPRsThisMonth > 0
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
          <PlusCircle className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
          Add Workout
        </Button>
      </div>

      {/* Stats Grid - Responsive with different column counts for different screen sizes */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value.toString()}
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
