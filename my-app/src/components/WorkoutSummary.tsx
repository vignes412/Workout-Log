import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { AccessTime, FitnessCenter, CalendarToday, LocalFireDepartment } from '@mui/icons-material';
import { TodaysWorkout, WorkoutExercise, WorkoutData } from '../types';
import { formatDate, calculateWorkoutProgress, parseNumeric } from '../utils/helpers';
import WorkoutSummaryTable from './WorkoutSummaryTable';
import { useDashboard } from '../context/DashboardContext';

interface ExtendedWorkoutData extends WorkoutData {
  endTime?: string;
}

interface WorkoutSummaryProps {
  workout: TodaysWorkout & { 
    notes?: string;
    endTime?: string; 
    workoutData?: ExtendedWorkoutData;
  };
  themeMode: 'light' | 'dark';
}

interface WorkoutStats {
  totalSets: number;
  completedSets: number;
  totalExercises: number;
  completedExercises: number;
  totalVolume: number;
  duration: number;
  estimatedCalories: number;
}

const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({ workout, themeMode }) => {
  // Access logs from DashboardContext to pass to the WorkoutSummaryTable
  const { logsAsLogEntries } = useDashboard();
  
  // Calculate workout statistics
  const stats = useMemo<WorkoutStats>(() => {
    if (!workout || !workout.workoutData || !workout.workoutData.exercises) {
      return {
        totalSets: 0,
        completedSets: 0,
        totalExercises: 0,
        completedExercises: 0,
        totalVolume: 0,
        duration: 0,
        estimatedCalories: 0
      };
    }

    const exercises = workout.workoutData.exercises;
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    let completedExercises = 0;

    exercises.forEach((exercise: WorkoutExercise) => {
      totalSets += exercise.sets;
      completedSets += exercise.setsCompleted || 0;
      
      // Calculate volume (sets * reps * weight)
      const exerciseVolume = (exercise.setsCompleted || 0) * exercise.reps * parseNumeric(exercise.weight);
      totalVolume += exerciseVolume;
      
      // Check if exercise is complete
      if ((exercise.setsCompleted || 0) >= exercise.sets) {
        completedExercises++;
      }
    });

    // Calculate duration in minutes
    const startTime = new Date(workout.workoutData.startTime).getTime();
    // Handle endTime which might be on workoutData or on the workout object
    const endTime = workout.workoutData.endTime 
      ? new Date(workout.workoutData.endTime).getTime() 
      : workout.endTime 
        ? new Date(workout.endTime).getTime()
        : new Date().getTime();
    const duration = Math.round((endTime - startTime) / (1000 * 60));
    
    // Estimate calories burned (very rough estimate)
    // Using the formula: calories = duration in minutes * MET * weight in kg / 60
    // MET for moderate intensity weightlifting is around 3-6
    // Assuming an average weight of 75kg
    const estimatedCalories = Math.round(duration * 5 * 75 / 60);

    return {
      totalSets,
      completedSets,
      totalExercises: exercises.length,
      completedExercises,
      totalVolume,
      duration,
      estimatedCalories
    };
  }, [workout]);

  // Calculate overall progress percentage
  const progressPercentage = useMemo<number>(() => {
    return calculateWorkoutProgress(workout);
  }, [workout]);

  // Group exercises by muscle group
  const exercisesByMuscleGroup = useMemo(() => {
    if (!workout?.workoutData?.exercises) return {};
    
    return workout.workoutData.exercises.reduce((groups: Record<string, WorkoutExercise[]>, exercise) => {
      const muscleGroup = exercise.muscleGroup || 'Uncategorized';
      if (!groups[muscleGroup]) {
        groups[muscleGroup] = [];
      }
      groups[muscleGroup].push(exercise);
      return groups;
    }, {});
  }, [workout]);

  // Check if we have valid logs data to display in the table
  const hasValidLogs = useMemo(() => {
    return Array.isArray(logsAsLogEntries) && logsAsLogEntries.length > 0;
  }, [logsAsLogEntries]);

  // Debug logs - helpful for understanding what data is available
  React.useEffect(() => {
    console.log('WorkoutSummary - logs data:', { 
      hasLogs: hasValidLogs,
      logsCount: logsAsLogEntries?.length || 0
    });
  }, [logsAsLogEntries, hasValidLogs]);

  if (!workout || !workout.workoutData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No workout data available</Typography>
        {hasValidLogs && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Workout Summary Table
            </Typography>
            <Box sx={{ mt: 2 }}>
              <WorkoutSummaryTable logs={logsAsLogEntries} themeMode={themeMode} />
            </Box>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Workout Summary
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            {workout.workoutData.templateName || 'Custom Workout'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CalendarToday fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(workout.date)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AccessTime fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Duration: {stats.duration} minutes
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Progress: {progressPercentage}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ height: 8, borderRadius: 3 }} 
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* Workout Statistics */}
      <Typography variant="h6" gutterBottom>
        Workout Statistics
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <FitnessCenter color="primary" />
            <Typography variant="h5">{stats.totalExercises}</Typography>
            <Typography variant="body2" color="text.secondary">Exercises</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h5">{stats.completedSets}/{stats.totalSets}</Typography>
            <Typography variant="body2" color="text.secondary">Sets Completed</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h5">{stats.totalVolume.toLocaleString()}</Typography>
            <Typography variant="body2" color="text.secondary">Volume (lbs)</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <LocalFireDepartment color="error" />
            <Typography variant="h5">{stats.estimatedCalories}</Typography>
            <Typography variant="body2" color="text.secondary">Est. Calories</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Exercises by Muscle Group */}
      <Typography variant="h6" gutterBottom>
        Exercises by Muscle Group
      </Typography>
      
      {Object.entries(exercisesByMuscleGroup).map(([muscleGroup, exercises]) => (
        <Card key={muscleGroup} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              {muscleGroup}
            </Typography>
            
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Exercise</TableCell>
                    <TableCell align="right">Sets</TableCell>
                    <TableCell align="right">Reps</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">Volume</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exercises.map((exercise, index) => {
                    const completedSets = exercise.setsCompleted || 0;
                    const volume = completedSets * exercise.reps * parseNumeric(exercise.weight);
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{exercise.exercise}</TableCell>
                        <TableCell align="right">
                          {completedSets}/{exercise.sets}
                        </TableCell>
                        <TableCell align="right">{exercise.reps}</TableCell>
                        <TableCell align="right">{exercise.weight || 0} lbs</TableCell>
                        <TableCell align="right">{volume.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
      
      {/* Workout Notes */}
      {workout.notes && (
        <>
          <Typography variant="h6" gutterBottom>
            Workout Notes
          </Typography>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="body2">
              {workout.notes}
            </Typography>
          </Paper>
        </>
      )}
      
      {/* Always show Workout Summary Table if there are logs */}
      {hasValidLogs && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Workout Summary Table
          </Typography>
          <Box sx={{ mt: 2 }}>
            <WorkoutSummaryTable logs={logsAsLogEntries} themeMode={themeMode} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default React.memo(WorkoutSummary);