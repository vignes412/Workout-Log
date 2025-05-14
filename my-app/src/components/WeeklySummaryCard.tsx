import React, { memo, useMemo } from "react";
import { Box, Typography, Paper, Grid, Divider } from "@mui/material";
import dayjs from "dayjs";
import { LogEntry } from "../types";
import { memoize } from "../utils/helpers";

interface WeeklySummaryProps {
  logs: LogEntry[];
}

interface SummaryData {
  totalVolume: number;
  totalWorkouts: number;
  mostWorkedMuscle: {
    muscle: string;
    count: number;
  };
  averageWeight: number;
  mostFrequentExercise: {
    exercise: string;
    count: number;
  };
  highestVolumeDay: {
    day: string;
    volume: number;
  };
}

// Memoized calculation functions to improve performance
const calculateMostWorkedMuscle = memoize((weeklyLogs: LogEntry[]) => {
  const muscleGroupCounts = weeklyLogs.reduce<Record<string, number>>((acc, log) => {
    const muscleGroup = log[1] as string;
    acc[muscleGroup] = (acc[muscleGroup] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(muscleGroupCounts).reduce(
    (max, [muscle, count]) => (count > max.count ? { muscle, count } : max),
    { muscle: "N/A", count: 0 }
  );
});

const calculateMostFrequentExercise = memoize((weeklyLogs: LogEntry[]) => {
  const exerciseCounts = weeklyLogs.reduce<Record<string, number>>((acc, log) => {
    const exercise = log[2] as string;
    acc[exercise] = (acc[exercise] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(exerciseCounts).reduce(
    (max, [exercise, count]) => (count > max.count ? { exercise, count } : max),
    { exercise: "N/A", count: 0 }
  );
});

const calculateHighestVolumeDay = memoize((weeklyLogs: LogEntry[]) => {
  const dailyVolumes = weeklyLogs.reduce<Record<string, number>>((acc, log) => {
    const date = log[0] as string;
    const reps = typeof log[3] === 'number' ? log[3] : parseFloat(String(log[3])) || 0;
    const weight = typeof log[4] === 'number' ? log[4] : parseFloat(String(log[4])) || 0;
    acc[date] = (acc[date] || 0) + reps * weight;
    return acc;
  }, {});

  return Object.entries(dailyVolumes).reduce(
    (max, [day, volume]) => (volume > max.volume ? { day, volume } : max),
    { day: "N/A", volume: 0 }
  );
});

const WeeklySummaryCard: React.FC<WeeklySummaryProps> = ({ logs }) => {
  const weeklySummary = useMemo<SummaryData>(() => {
    if (!logs || logs.length === 0) {
      return {
        totalVolume: 0,
        totalWorkouts: 0,
        mostWorkedMuscle: { muscle: "N/A", count: 0 },
        averageWeight: 0,
        mostFrequentExercise: { exercise: "N/A", count: 0 },
        highestVolumeDay: { day: "N/A", volume: 0 }
      };
    }

    const oneWeekAgo = dayjs().subtract(7, "day");
    const weeklyLogs = logs.filter((log) =>
      dayjs(log[0] as string, "MM/DD/YYYY").isAfter(oneWeekAgo)
    );

    if (weeklyLogs.length === 0) {
      return {
        totalVolume: 0,
        totalWorkouts: 0,
        mostWorkedMuscle: { muscle: "N/A", count: 0 },
        averageWeight: 0,
        mostFrequentExercise: { exercise: "N/A", count: 0 },
        highestVolumeDay: { day: "N/A", volume: 0 }
      };
    }

    const totalVolume = weeklyLogs.reduce((sum, log) => {
      const reps = typeof log[3] === 'number' ? log[3] : parseFloat(String(log[3])) || 0;
      const weight = typeof log[4] === 'number' ? log[4] : parseFloat(String(log[4])) || 0;
      return sum + reps * weight;
    }, 0);

    const totalWorkouts = [...new Set(weeklyLogs.map(log => log[0]))].length;
    
    const mostWorkedMuscle = calculateMostWorkedMuscle(weeklyLogs);
    const mostFrequentExercise = calculateMostFrequentExercise(weeklyLogs);
    const highestVolumeDay = calculateHighestVolumeDay(weeklyLogs);

    // Calculate average weight
    const totalWeight = weeklyLogs.reduce((sum, log) => {
      const weight = typeof log[4] === 'number' ? log[4] : parseFloat(String(log[4])) || 0;
      return sum + weight;
    }, 0);
    const averageWeight = totalWeight / weeklyLogs.length || 0;

    return {
      totalVolume,
      totalWorkouts,
      mostWorkedMuscle,
      averageWeight,
      mostFrequentExercise,
      highestVolumeDay
    };
  }, [logs]);

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: (theme) => 
          theme.palette.mode === 'dark' 
            ? '0 3px 10px rgba(0,0,0,0.5)' 
            : '0 3px 10px rgba(0,0,0,0.1)',
        height: '100%',
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) => 
            theme.palette.mode === 'dark' 
              ? '0 6px 12px rgba(0,0,0,0.6)' 
              : '0 6px 12px rgba(0,0,0,0.15)',
        }
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontWeight: 600 }}>
        Last 7 Days
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Volume
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {weeklySummary.totalVolume.toLocaleString()} kg
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Workouts
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {weeklySummary.totalWorkouts}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Most Worked Muscle
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {weeklySummary.mostWorkedMuscle.muscle} ({weeklySummary.mostWorkedMuscle.count}x)
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Average Weight
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {weeklySummary.averageWeight.toFixed(1)} kg
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Most Frequent Exercise
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {weeklySummary.mostFrequentExercise.exercise} ({weeklySummary.mostFrequentExercise.count}x)
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default memo(WeeklySummaryCard);