import React, { memo, useMemo } from "react";
import { Box, Typography, Grid, Paper, Tooltip, Chip } from "@mui/material";
import { 
  EmojiEvents as TrophyIcon, 
  FitnessCenter as WeightIcon,
  Bolt as StreakIcon,
  BarChart as StatsIcon,
  Whatshot as HotIcon,
  Star as StarIcon 
} from "@mui/icons-material";
import dayjs from "dayjs";
import { LogEntry } from "../types";
import { memoize } from "../utils/helpers";

interface AchievementCardProps {
  logs: LogEntry[];
}

interface AchievementData {
  maxPushUpReps: number;
  maxPullUpReps: number;
  longestStreak: number;
  heaviestLift: {
    weight: number;
    exercise: string;
  };
  mostWorkedMuscle: {
    muscle: string;
    count: number;
  };
  bestDay: {
    date: string;
    avg: number;
  };
}

// Memoized calculation functions to improve performance
const calculateMaxRepsByExercise = memoize((logs: LogEntry[], exerciseName: string): number => {
  if (!logs || logs.length === 0) return 0;
  
  const exerciseLogs = logs.filter(log => {
    const exercise = log[2] as string;
    return exercise.toLowerCase() === exerciseName.toLowerCase();
  });
  
  if (exerciseLogs.length === 0) return 0;
  
  return Math.max(...exerciseLogs.map(log => {
    const reps = typeof log[3] === 'string' ? parseFloat(log[3]) : log[3];
    return isNaN(reps) ? 0 : reps;
  }), 0);
});

const calculateHeaviestLift = memoize((logs: LogEntry[]): {weight: number; exercise: string} => {
  if (!logs || logs.length === 0) return { weight: 0, exercise: "" };
  
  return logs
    .filter(log => {
      const weight = typeof log[4] === 'string' ? parseFloat(log[4]) : log[4];
      return !isNaN(weight) && weight > 0;
    })
    .reduce(
      (max, log) => {
        const weight = typeof log[4] === 'string' ? parseFloat(log[4]) : log[4];
        const exercise = log[2] as string;
        return weight > max.weight ? { weight, exercise } : max;
      },
      { weight: 0, exercise: "" }
    );
});

const calculateMostWorkedMuscle = memoize((logs: LogEntry[]): {muscle: string; count: number} => {
  if (!logs || logs.length === 0) return { muscle: "", count: 0 };
  
  const muscleCounts = logs.reduce<Record<string, number>>((acc, log) => {
    const muscle = log[1] as string;
    acc[muscle] = (acc[muscle] || 0) + 1;
    return acc;
  }, {});
  
  return Object.entries(muscleCounts).reduce(
    (max, [muscle, count]) => (count > max.count ? { muscle, count } : max),
    { muscle: "", count: 0 }
  );
});

const calculateBestDay = memoize((logs: LogEntry[]): {date: string; avg: number} => {
  if (!logs || logs.length === 0) return { date: "", avg: 0 };
  
  const dayRatings = logs.reduce<Record<string, {sum: number; count: number}>>((acc, log) => {
    const date = log[0] as string;
    const rating = typeof log[5] === 'string' ? parseFloat(log[5]) : log[5];
    const validRating = !isNaN(rating) ? rating : 7; // Default to 7 if N/A or invalid
    
    if (!acc[date]) acc[date] = { sum: 0, count: 0 };
    acc[date].sum += validRating;
    acc[date].count++;
    return acc;
  }, {});
  
  return Object.entries(dayRatings).reduce(
    (max, [date, { sum, count }]) => {
      const avg = sum / count;
      return avg > max.avg ? { date, avg } : max;
    },
    { date: "", avg: 0 }
  );
});

const AchievementsCard: React.FC<AchievementCardProps> = ({ logs }) => {
  const achievements = useMemo<AchievementData>(() => {
    if (!logs || logs.length === 0) {
      return {
        maxPushUpReps: 0,
        maxPullUpReps: 0,
        longestStreak: 0,
        heaviestLift: { weight: 0, exercise: "" },
        mostWorkedMuscle: { muscle: "", count: 0 },
        bestDay: { date: "", avg: 0 }
      };
    }

    // Use memoized functions for expensive calculations
    const maxPushUpReps = calculateMaxRepsByExercise(logs, "push-up");
    const maxPullUpReps = calculateMaxRepsByExercise(logs, "pull-up");
    const heaviestLift = calculateHeaviestLift(logs);
    const mostWorkedMuscle = calculateMostWorkedMuscle(logs);
    const bestDay = calculateBestDay(logs);

    // Calculate the longest streak (consecutive workout days)
    const sortedDates = [...new Set(logs.map((log) => log[0] as string))]
      .map((date) => dayjs(date, "MM/DD/YYYY"))
      .sort((a, b) => a.valueOf() - b.valueOf());
    
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i].diff(sortedDates[i - 1], "day") === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return {
      maxPushUpReps,
      maxPullUpReps,
      longestStreak: maxStreak,
      heaviestLift,
      mostWorkedMuscle,
      bestDay
    };
  }, [logs]);

  // Achievement card content with icons
  const achievementItems = [
    {
      label: "Max Push-Up Reps",
      value: `${achievements.maxPushUpReps} reps`,
      icon: <WeightIcon fontSize="small" color="primary" />,
      color: "#ff7043"
    },
    {
      label: "Max Pull-Up Reps",
      value: `${achievements.maxPullUpReps} reps`,
      icon: <WeightIcon fontSize="small" color="primary" />,
      color: "#7e57c2"
    },
    {
      label: "Longest Streak",
      value: `${achievements.longestStreak} days`,
      icon: <StreakIcon fontSize="small" color="primary" />,
      color: "#4caf50"
    },
    {
      label: "Heaviest Lift",
      value: achievements.heaviestLift.weight > 0 
        ? `${achievements.heaviestLift.weight.toFixed(1)} kg (${achievements.heaviestLift.exercise})`
        : "N/A",
      icon: <WeightIcon fontSize="small" color="primary" />,
      color: "#f44336"
    },
    {
      label: "Most Worked Muscle",
      value: achievements.mostWorkedMuscle.count > 0 
        ? `${achievements.mostWorkedMuscle.muscle} (${achievements.mostWorkedMuscle.count}x)`
        : "N/A",
      icon: <StatsIcon fontSize="small" color="primary" />,
      color: "#3f51b5"
    },
    {
      label: "Best Workout Day",
      value: achievements.bestDay.avg > 0 
        ? `${achievements.bestDay.date} (${achievements.bestDay.avg.toFixed(1)}/10)`
        : "N/A",
      icon: <StarIcon fontSize="small" color="primary" />,
      color: "#ffc107"
    },
  ];

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
      <Box display="flex" alignItems="center" mb={2}>
        <TrophyIcon sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Achievements
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        {achievementItems.map((achievement, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Tooltip title={achievement.label} placement="top">
              <Paper
                sx={{
                  bgcolor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                  p: 1.5,
                  borderRadius: 2,
                  borderLeft: `4px solid ${achievement.color}`,
                  height: '100%',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: (theme) => 
                      theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.04)',
                  }
                }}
              >
                <Box display="flex" flexDirection="column">
                  <Box display="flex" alignItems="center" mb={0.5}>
                    {achievement.icon}
                    <Typography variant="body2" color="text.secondary" ml={1} sx={{ fontWeight: 500 }}>
                      {achievement.label}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {achievement.value}
                  </Typography>
                </Box>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default memo(AchievementsCard);