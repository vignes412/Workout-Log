import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { 
  DateRange, 
  FitnessCenter
} from '@mui/icons-material';
import { WorkoutLog } from '../types';
import { formatDate, parseNumeric } from '../utils/helpers';

interface ExerciseSet {
  reps: number;
  weight: number | string;
}

interface ExtendedWorkoutExercise {
  exercise: string;
  muscleGroup: string;
  sets?: number | ExerciseSet[];
  reps: number;
  weight: string | number;
  setsCompleted?: number;
  restTime?: number;
  muscle?: string;
}

interface ExtendedWorkoutLog extends WorkoutLog {
  exercises?: ExtendedWorkoutExercise[];
}

interface WeeklySummaryProps {
  workoutLogs: ExtendedWorkoutLog[];
  themeMode: 'light' | 'dark';
}

interface DayStats {
  date: string;
  formattedDate: string;
  dayName: string;
  workoutDone: boolean;
  totalVolume: number;
  totalSets: number;
  muscleGroups: string[];
}

const WeeklySummary: React.FC<WeeklySummaryProps> = React.memo(({ 
  workoutLogs, 
  themeMode 
}) => {
  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    // Get current date and start of week (Sunday)
    const today = new Date();
    const startOfWeek = new Date(today);
    const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
    startOfWeek.setDate(today.getDate() - currentDay);
    
    // Create array for each day of the week
    const days: DayStats[] = [];
    
    // Format day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Populate day stats for the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Find workouts for this date
      const dayWorkouts = workoutLogs.filter(log => log.date === dateString);
      
      // Calculate stats for this day
      let totalVolume = 0;
      let totalSets = 0;
      const muscleGroups: string[] = [];
      
      dayWorkouts.forEach(workout => {
        if (workout.exercises) {
          workout.exercises.forEach((exercise: ExtendedWorkoutExercise) => {
            // Add muscle group
            if (exercise.muscle && !muscleGroups.includes(exercise.muscle)) {
              muscleGroups.push(exercise.muscle);
            }
            
            // Calculate total sets and volume
            const sets = typeof exercise.sets === 'number' ? exercise.sets : (exercise.sets?.length || 0);
            totalSets += sets;
            
            // Calculate volume (weight lifted)
            let weight = 0;
            if (Array.isArray(exercise.sets)) {
              weight = exercise.sets.reduce((total: number, set: ExerciseSet) => total + parseNumeric(set.weight), 0);
            } else if (typeof exercise.weight !== 'undefined') {
              // If sets is a number, use exercise.weight directly
              weight = parseNumeric(exercise.weight) * (typeof exercise.sets === 'number' ? exercise.sets : 0);
            }
            totalVolume += weight;
          });
        }
      });
      
      days.push({
        date: dateString,
        formattedDate: formatDate(dateString, 'MMM d'),
        dayName: dayNames[i],
        workoutDone: dayWorkouts.length > 0,
        totalVolume,
        totalSets,
        muscleGroups
      });
    }
    
    // Calculate weekly totals
    const totalWorkouts = days.filter(day => day.workoutDone).length;
    const totalVolume = days.reduce((sum, day) => sum + day.totalVolume, 0);
    const totalSets = days.reduce((sum, day) => sum + day.totalSets, 0);
    
    // Get unique muscle groups worked this week
    const muscleGroupsWorked = [...new Set(
      days.flatMap(day => day.muscleGroups)
    )];
    
    return {
      days,
      totalWorkouts,
      totalVolume,
      totalSets,
      muscleGroupsWorked
    };
  }, [workoutLogs]);

  // Calculate current day
  const currentDayIndex = useMemo(() => {
    const today = new Date().getDay(); // 0 is Sunday
    return today;
  }, []);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DateRange sx={{ mr: 1 }} />
          <Typography variant="h6">
            Weekly Workout Summary
          </Typography>
        </Box>
        
        {/* Weekly stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: themeMode === 'dark' ? 'background.paper' : 'grey.100' }}>
              <Typography variant="h5">{weeklyStats.totalWorkouts}</Typography>
              <Typography variant="body2" color="text.secondary">Workouts</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={4}>
            <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: themeMode === 'dark' ? 'background.paper' : 'grey.100' }}>
              <Typography variant="h5">{weeklyStats.totalSets}</Typography>
              <Typography variant="body2" color="text.secondary">Sets</Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={4}>
            <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', bgcolor: themeMode === 'dark' ? 'background.paper' : 'grey.100' }}>
              <Typography variant="h5">{weeklyStats.totalVolume.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Volume</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Day pills */}
        <Typography variant="subtitle2" gutterBottom>
          Daily Activity
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          {weeklyStats.days.map((day, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                py: 1,
                px: 1.5,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid',
                borderColor: index === currentDayIndex ? 'primary.main' : 'divider',
                bgcolor: day.workoutDone 
                  ? themeMode === 'dark' ? 'success.dark' : 'success.light' 
                  : index === currentDayIndex 
                    ? themeMode === 'dark' ? 'primary.dark' : 'primary.light'
                    : 'transparent',
                color: day.workoutDone
                  ? themeMode === 'dark' ? 'common.white' : 'common.black'
                  : index === currentDayIndex
                    ? themeMode === 'dark' ? 'common.white' : 'primary.dark'
                    : 'text.primary',
                opacity: index === currentDayIndex ? 1 : 0.8,
                flex: 1,
                mx: 0.3,
                minWidth: 'auto'
              }}
            >
              <Typography variant="caption" display="block">
                {day.dayName}
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight={index === currentDayIndex ? 'bold' : 'regular'}
              >
                {day.formattedDate.split(' ')[1]}
              </Typography>
              {day.workoutDone && (
                <Box 
                  sx={{ 
                    height: 4, 
                    width: 4, 
                    borderRadius: '50%', 
                    bgcolor: themeMode === 'dark' ? 'common.white' : 'success.dark',
                    mx: 'auto',
                    mt: 0.5
                  }} 
                />
              )}
            </Paper>
          ))}
        </Box>
        
        {/* Muscle groups */}
        {weeklyStats.muscleGroupsWorked.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Muscle Groups This Week
            </Typography>
            <Box sx={{ mb: 1 }}>
              {weeklyStats.muscleGroupsWorked.map((muscle, index) => (
                <Chip 
                  key={index}
                  label={muscle}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          </>
        )}
        
        {/* Day details */}
        {weeklyStats.days.some(day => day.workoutDone) && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Workout Days
            </Typography>
            
            {weeklyStats.days.filter(day => day.workoutDone).map((day, index) => (
              <Box key={index} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <FitnessCenter fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium">
                    {day.formattedDate} ({day.dayName})
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {day.totalSets} sets
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {day.totalVolume.toLocaleString()} volume
                  </Typography>
                </Box>
                
                {day.muscleGroups.length > 0 && (
                  <Box sx={{ pl: 2, mt: 0.5 }}>
                    {day.muscleGroups.map((muscle, idx) => (
                      <Chip 
                        key={idx}
                        label={muscle}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default WeeklySummary;