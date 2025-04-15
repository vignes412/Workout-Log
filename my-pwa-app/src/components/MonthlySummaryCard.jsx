import React, { useMemo } from "react";
import { Box, Typography, Grid } from "@mui/material";
import dayjs from "dayjs";

const MonthlySummaryCard = ({ logs }) => {
  const monthlySummary = useMemo(() => {
    if (!logs || logs.length === 0) return {};

    const oneMonthAgo = dayjs().subtract(1, "month");
    const monthlyLogs = logs.filter((log) =>
      dayjs(log[0], "MM/DD/YYYY").isAfter(oneMonthAgo)
    );

    const totalVolume = monthlyLogs.reduce((sum, log) => {
      const reps = parseFloat(log[3]) || 0;
      const weight = parseFloat(log[4]) || 0;
      return sum + reps * weight;
    }, 0);

    const totalWorkouts = monthlyLogs.length;

    const muscleGroupCounts = monthlyLogs.reduce((acc, log) => {
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
        Monthly Summary
      </Typography>
      <Grid container spacing={2}>
        {[
          {
            label: "Total Volume",
            value: `${monthlySummary.totalVolume || 0} kg`,
          },
          { label: "Total Workouts", value: monthlySummary.totalWorkouts || 0 },
          {
            label: "Most Worked Muscle",
            value: monthlySummary.mostWorkedMuscle || "N/A",
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

export default MonthlySummaryCard;
