import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  FitnessCenter, 
  AccessTime, 
  Timer
} from '@mui/icons-material';
import { WorkoutLog } from '../types';
import { parseNumeric } from '../utils/helpers';

// Define types for exercises and sets
interface ExerciseSet {
  reps: number;
  weight: number | string;
}

interface WorkoutExercise {
  name: string;
  muscle?: string;
  sets?: ExerciseSet[];
  reps?: number;
  weight?: number | string;
}

// Extend WorkoutLog interface with properties we need
interface ExtendedWorkoutLog extends WorkoutLog {
  exercises?: WorkoutExercise[];
  duration?: number;
}

interface ProgressTrackerProps {
  workoutLogs: ExtendedWorkoutLog[];
  period?: 'week' | 'month' | 'year';
  themeMode: 'light' | 'dark';
}

interface ProgressMetrics {
  totalWorkouts: number;
  totalVolume: number;
  averageVolume: number;
  volumeTrend: 'up' | 'down' | 'flat';
  volumeChange: number;
  totalSets: number;
  totalReps: number;
  averageWeight: number;
  strongestMuscleGroup: string;
  mostFrequentExercise: string;
  maxWeight: number;
  maxWeightExercise: string;
  workoutFrequency: number;
  averageDuration: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  workoutLogs, 
  period = 'month',
  themeMode
}) => {
  // Calculate all progress metrics
  const metrics = useMemo<ProgressMetrics>(() => {
    if (!workoutLogs || workoutLogs.length === 0) {
      return {
        totalWorkouts: 0,
        totalVolume: 0,
        averageVolume: 0,
        volumeTrend: 'flat',
        volumeChange: 0,
        totalSets: 0,
        totalReps: 0,
        averageWeight: 0,
        strongestMuscleGroup: 'N/A',
        mostFrequentExercise: 'N/A',
        maxWeight: 0,
        maxWeightExercise: 'N/A',
        workoutFrequency: 0,
        averageDuration: 0
      };
    }

    // Sort logs by date
    const sortedLogs = [...workoutLogs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate total volume
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalWeight = 0;
    let weightPoints = 0;
    let maxWeight = 0;
    let maxWeightExercise = '';
    let totalDuration = 0;

    // Track muscle groups and exercises
    const muscleGroupVolume: Record<string, number> = {};
    const exerciseFrequency: Record<string, number> = {};

    sortedLogs.forEach(log => {
      // Process each exercise in the log
      if (log.exercises) {
        log.exercises.forEach((exercise: WorkoutExercise) => {
          // Update total volume (sets * reps * weight)
          const sets = exercise.sets?.length || 0;
          const reps = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + set.reps, 0) || 0;
          const weight = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + parseNumeric(set.weight), 0) || 0;
          
          const exerciseVolume = weight;
          totalVolume += exerciseVolume;
          
          // Update totals
          totalSets += sets;
          totalReps += reps;
          totalWeight += weight;
          weightPoints += sets; // Count each set as a weight data point
          
          // Track max weight
          const maxSetWeight = Math.max(...(exercise.sets?.map((set: ExerciseSet) => parseNumeric(set.weight)) || [0]));
          if (maxSetWeight > maxWeight) {
            maxWeight = maxSetWeight;
            maxWeightExercise = exercise.name;
          }
          
          // Track muscle group volume
          if (exercise.muscle) {
            muscleGroupVolume[exercise.muscle] = (muscleGroupVolume[exercise.muscle] || 0) + exerciseVolume;
          }
          
          // Track exercise frequency
          if (exercise.name) {
            exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
          }
        });
      }
      
      // Add workout duration if available
      if (log.duration) {
        totalDuration += log.duration;
      }
    });

    // Calculate average weight
    const averageWeight = weightPoints > 0 ? totalWeight / weightPoints : 0;
    
    // Find strongest muscle group
    let strongestMuscleGroup = 'N/A';
    let highestVolume = 0;
    Object.entries(muscleGroupVolume).forEach(([muscle, volume]) => {
      if (volume > highestVolume) {
        highestVolume = volume;
        strongestMuscleGroup = muscle;
      }
    });
    
    // Find most frequent exercise
    let mostFrequentExercise = 'N/A';
    let highestFrequency = 0;
    Object.entries(exerciseFrequency).forEach(([exercise, frequency]) => {
      if (frequency > highestFrequency) {
        highestFrequency = frequency;
        mostFrequentExercise = exercise;
      }
    });
    
    // Calculate volume trend
    let volumeTrend: 'up' | 'down' | 'flat' = 'flat';
    let volumeChange = 0;
    
    if (sortedLogs.length > 1) {
      // Split logs into two equal parts to compare progress
      const midpoint = Math.floor(sortedLogs.length / 2);
      const firstHalfLogs = sortedLogs.slice(0, midpoint);
      const secondHalfLogs = sortedLogs.slice(midpoint);
      
      // Calculate volumes for both halves
      let firstHalfVolume = 0;
      let secondHalfVolume = 0;
      
      firstHalfLogs.forEach(log => {
        if (log.exercises) {
          log.exercises.forEach((exercise: WorkoutExercise) => {
            const sets = exercise.sets?.length || 0;
            const reps = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + set.reps, 0) || 0;
            const weight = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + parseNumeric(set.weight), 0) || 0;
            firstHalfVolume += weight;
          });
        }
      });
      
      secondHalfLogs.forEach(log => {
        if (log.exercises) {
          log.exercises.forEach((exercise: WorkoutExercise) => {
            const sets = exercise.sets?.length || 0;
            const reps = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + set.reps, 0) || 0;
            const weight = exercise.sets?.reduce((total: number, set: ExerciseSet) => total + parseNumeric(set.weight), 0) || 0;
            secondHalfVolume += weight;
          });
        }
      });
      
      // Normalize volumes by the number of workouts in each half
      const normalizedFirstVolume = firstHalfVolume / firstHalfLogs.length;
      const normalizedSecondVolume = secondHalfVolume / secondHalfLogs.length;
      
      // Calculate percentage change
      if (normalizedFirstVolume > 0) {
        volumeChange = ((normalizedSecondVolume - normalizedFirstVolume) / normalizedFirstVolume) * 100;
      }
      
      // Determine trend
      if (volumeChange > 5) {
        volumeTrend = 'up';
      } else if (volumeChange < -5) {
        volumeTrend = 'down';
      }
    }
    
    // Calculate workout frequency per week
    const firstDate = new Date(sortedLogs[0].date);
    const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date);
    const totalDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const workoutFrequency = sortedLogs.length / (totalDays / 7);
    
    // Calculate average duration
    const averageDuration = sortedLogs.length > 0 ? totalDuration / sortedLogs.length : 0;
    
    return {
      totalWorkouts: sortedLogs.length,
      totalVolume,
      averageVolume: sortedLogs.length > 0 ? totalVolume / sortedLogs.length : 0,
      volumeTrend,
      volumeChange,
      totalSets,
      totalReps,
      averageWeight,
      strongestMuscleGroup,
      mostFrequentExercise,
      maxWeight,
      maxWeightExercise,
      workoutFrequency,
      averageDuration
    };
  }, [workoutLogs]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Progress Tracker {period === 'week' ? '(This Week)' : period === 'month' ? '(This Month)' : '(This Year)'}
      </Typography>
      
      {/* Main stats grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6">{metrics.totalWorkouts}</Typography>
            <Typography variant="body2" color="text.secondary">Total Workouts</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                {metrics.volumeChange > 0 && <TrendingUp color="success" sx={{ mr: 0.5 }} />}
                {metrics.volumeChange < 0 && <TrendingDown color="error" sx={{ mr: 0.5 }} />}
                {metrics.volumeChange === 0 && <TrendingFlat color="action" sx={{ mr: 0.5 }} />}
                {Math.abs(metrics.volumeChange).toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Volume Progress</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6">{metrics.totalVolume.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Total Volume (lbs)</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6">
                {metrics.workoutFrequency.toFixed(1)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">Workouts/Week</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Secondary stats */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workout Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Sets Completed
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ height: 8, borderRadius: 3 }} 
                    />
                  </Box>
                  <Typography variant="body2">{metrics.totalSets}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Total Reps
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ height: 8, borderRadius: 3 }} 
                    />
                  </Box>
                  <Typography variant="body2">{metrics.totalReps}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Avg. Workout Duration
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {metrics.averageDuration.toFixed(0)} minutes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Records
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Strongest Muscle Group
                </Typography>
                <Typography variant="body1">
                  {metrics.strongestMuscleGroup}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Most Frequent Exercise
                </Typography>
                <Typography variant="body1">
                  {metrics.mostFrequentExercise}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">
                  Max Weight
                </Typography>
                <Typography variant="body1">
                  {metrics.maxWeight} lbs ({metrics.maxWeightExercise})
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default React.memo(ProgressTracker);