import React from 'react';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import { VolumeOverTimeLineChart } from './VolumeOverTimeChart';
import { VolumeByMuscleGroupBarChart } from './VolumeByMuscleGroupChart';
import { MuscleGroupVolumeDistributionRadarChart } from './MuscleGroupDistributionChart';
import { RelativeDailyVolumeLineChart } from './RelativeDailyVolumeChart';
import { RecentFatigueByMuscleGroupBarChart } from './FatigueByMuscleGroupChart';
import { ProgressionAndFatigueLineChart } from './ProgressionAndFatigueChart';
import './ChartStyles.css';

// --- Main Export ---
interface WorkoutChartsProps {
  workoutLogs: WorkoutLogEntry[];
}

export const WorkoutCharts: React.FC<WorkoutChartsProps> = ({ workoutLogs }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VolumeOverTimeLineChart logs={workoutLogs} />
        <RelativeDailyVolumeLineChart logs={workoutLogs} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProgressionAndFatigueLineChart logs={workoutLogs} />
        <MuscleGroupVolumeDistributionRadarChart logs={workoutLogs} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VolumeByMuscleGroupBarChart logs={workoutLogs} />
        <RecentFatigueByMuscleGroupBarChart logs={workoutLogs} />
      </div>
    </div>
  );
};

export default WorkoutCharts;
