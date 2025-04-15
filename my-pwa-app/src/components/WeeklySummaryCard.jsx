import React, { useMemo } from "react";
import { Box, Typography, Grid } from "@mui/material";
import dayjs from "dayjs";

const WeeklySummaryCard = ({ logs }) => {
  const weeklySummary = useMemo(() => {
    if (!logs || logs.length === 0) return {};

    const oneWeekAgo = dayjs().subtract(7, "day");
    const weeklyLogs = logs.filter((log) =>
      dayjs(log[0], "MM/DD/YYYY").isAfter(oneWeekAgo)
    );

    const totalVolume = weeklyLogs.reduce((sum, log) => {
      const reps = parseFloat(log[3]) || 0;
      const weight = parseFloat(log[4]) || 0;
      return sum + reps * weight;
    }, 0);

    const totalWorkouts = weeklyLogs.length;

    const muscleGroupCounts = weeklyLogs.reduce((acc, log) => {
      acc[log[1]] = (acc[log[1]] || 0) + 1;
      return acc;
    }, {});

    const mostWorkedMuscle = Object.entries(muscleGroupCounts).reduce(
      (max, [muscle, count]) => (count > max.count ? { muscle, count } : max),
      { muscle: "N/A", count: 0 }
    );

    return {
      totalVolume,
      totalWorkouts,
      mostWorkedMuscle: `${mostWorkedMuscle.muscle} (${mostWorkedMuscle.count} times)`,
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
        Weekly Summary
      </Typography>
      <Grid container spacing={2}>
        {[
          {
            label: "Total Volume",
            value: `${weeklySummary.totalVolume || 0} kg`,
          },
          { label: "Total Workouts", value: weeklySummary.totalWorkouts || 0 },
          {
            label: "Most Worked Muscle",
            value: weeklySummary.mostWorkedMuscle || "N/A",
          },
        ].map((summary, index) => (
          <Grid item xs={12} sm={4} key={index}>
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
                {summary.label}
              </Typography>
              <Typography variant="body1" sx={{ color: "black" }}>
                {summary.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default WeeklySummaryCard;
