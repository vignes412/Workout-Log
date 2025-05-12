import React from 'react';
import { StatCard } from './StatCard';
import { Dumbbell, Activity, Calendar, ArrowUpCircle } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  // Mock data - in a real app, this would come from your state/store
  const stats = [
    {
      title: 'Total Workouts',
      value: 32,
      description: 'Since you started',
      icon: <Calendar className="w-4 h-4" />,
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: 'Weekly Average',
      value: '3.2',
      description: 'Sessions per week',
      icon: <Activity className="w-4 h-4" />,
      trend: {
        value: 8,
        isPositive: true
      }
    },
    {
      title: 'Weight Lifted',
      value: '1,280 kg',
      description: 'Total this month',
      icon: <Dumbbell className="w-4 h-4" />,
      trend: {
        value: 5,
        isPositive: true
      }
    },
    {
      title: 'Personal Records',
      value: 12,
      description: '3 new this month',
      icon: <ArrowUpCircle className="w-4 h-4" />,
      trend: {
        value: 15,
        isPositive: true
      }
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
  );
};
