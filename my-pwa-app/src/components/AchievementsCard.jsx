import React, { useMemo } from "react";
import { Box, Typography, Grid } from "@mui/material";
import dayjs from "dayjs"; // Import dayjs

const AchievementsCard = ({ logs }) => {
  const achievements = useMemo(() => {
    if (!logs || logs.length === 0) return {};

    // Helper to parse numbers safely
    const parseNumber = (value) =>
      isNaN(parseFloat(value)) ? 0 : parseFloat(value);

    // 1. Max Push-Up Reps
    const maxPushUpReps = Math.max(
      ...logs
        .filter((log) => log[2].toLowerCase() === "push-up")
        .map((log) => parseNumber(log[3])),
      0
    );

    // 2. Max Pull-Up Reps
    const maxPullUpReps = Math.max(
      ...logs
        .filter((log) => log[2].toLowerCase() === "pull-up")
        .map((log) => parseNumber(log[3])),
      0
    );

    // 3. Longest Workout Streak (Updated with dayjs)
    const sortedDates = [...new Set(logs.map((log) => log[0]))] // Unique dates
      .map((date) => dayjs(date, "MM/DD/YYYY")) // Parse dates with dayjs
      .sort((a, b) => a.valueOf() - b.valueOf()); // Sort ascending using Unix timestamp
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i].diff(sortedDates[i - 1], "day") === 1) {
        // Use dayjs diff
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // 4. Heaviest Lift
    const heaviestLift = logs
      .filter((log) => parseNumber(log[4]) > 0) // Exclude bodyweight
      .reduce(
        (max, log) => {
          const weight = parseNumber(log[4]);
          return weight > max.weight ? { weight, exercise: log[2] } : max;
        },
        { weight: 0, exercise: "" }
      );

    // 5. Most Worked Muscle
    const muscleCounts = logs.reduce((acc, log) => {
      acc[log[1]] = (acc[log[1]] || 0) + 1;
      return acc;
    }, {});
    const mostWorkedMuscle = Object.entries(muscleCounts).reduce(
      (max, [muscle, count]) => (count > max.count ? { muscle, count } : max),
      { muscle: "", count: 0 }
    );

    // 6. Best Workout Day
    const dayRatings = logs.reduce((acc, log) => {
      const date = log[0];
      const rating = parseNumber(log[5]) || 7; // Default to 7 if N/A
      if (!acc[date]) acc[date] = { sum: 0, count: 0 };
      acc[date].sum += rating;
      acc[date].count++;
      return acc;
    }, {});
    const bestDay = Object.entries(dayRatings).reduce(
      (max, [date, { sum, count }]) => {
        const avg = sum / count;
        return avg > max.avg ? { date, avg } : max;
      },
      { date: "", avg: 0 }
    );

    return {
      maxPushUpReps,
      maxPullUpReps,
      longestStreak: maxStreak,
      heaviestLift: `${heaviestLift.weight.toFixed(2)} kg (${
        heaviestLift.exercise
      })`,
      mostWorkedMuscle: `${mostWorkedMuscle.muscle} (${mostWorkedMuscle.count} workouts)`,
      bestDay: `${bestDay.date} (${bestDay.avg.toFixed(1)}/10)`,
    };
  }, [logs]);

  return (
    <Box
      className="card"
      sx={{
        bgcolor: "background.paper",
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        maxWidth: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, textAlign: "center", color: "text.primary" }}
      >
        Achievements
      </Typography>
      <Grid container spacing={2}>
        {[
          {
            label: "Max Push-Up Reps",
            value: `${achievements.maxPushUpReps} reps`,
          },
          {
            label: "Max Pull-Up Reps",
            value: `${achievements.maxPullUpReps} reps`,
          },
          {
            label: "Longest Streak",
            value: `${achievements.longestStreak} days`,
          },
          { label: "Heaviest Lift", value: achievements.heaviestLift },
          { label: "Most Worked Muscle", value: achievements.mostWorkedMuscle },
          { label: "Best Workout Day", value: achievements.bestDay },
        ].map((achievement, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box
              sx={{
                bgcolor: "grey.100",
                p: 1.5,
                borderRadius: 1,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", color: "black" }}
              >
                {achievement.label}
              </Typography>
              <Typography variant="body1" sx={{ color: "black" }}>
                {achievement.value || "N/A"}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AchievementsCard;
