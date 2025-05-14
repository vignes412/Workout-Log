import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";

interface StreakTrackerProps {
  logs: Array<any>;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ logs }) => {
  const streakData = useMemo((): StreakData => {
    if (!logs || logs.length === 0)
      return { currentStreak: 0, longestStreak: 0 };

    const sortedDates = [...new Set(logs.map((log) => log[0]))]
      .map((date) => dayjs(date, "MM/DD/YYYY"))
      .sort((a, b) => a.valueOf() - b.valueOf());

    let currentStreak = 1;
    let longestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      if (sortedDates[i].diff(sortedDates[i - 1], "day") === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
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
        Streak Tracker
      </Typography>
      <Typography
        variant="body1"
        sx={{ textAlign: "center", color: "text.primary" }}
      >
        Current Streak: {streakData.currentStreak} days
      </Typography>
      <Typography
        variant="body1"
        sx={{ textAlign: "center", color: "text.primary" }}
      >
        Longest Streak: {streakData.longestStreak} days
      </Typography>
    </Box>
  );
};

export default React.memo(StreakTracker);