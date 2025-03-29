import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Typography, Box, Paper, useTheme, Grid, Alert } from "@mui/material";
import { computeDailyMetrics } from "../utils/computeDailyMetrics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ logs, themeMode }) => {
  const theme = useTheme();
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

const processedData = useMemo(() => {
  if (!logs || logs.length === 0) return {};

  const dates = [...new Set(logs.map((log) => log[0]))].sort();
  const muscleGroups = [...new Set(logs.map((log) => log[1]))];
  const currentDate = new Date(); // Current date as per system info
  const tenDaysAgo = new Date(currentDate);
  tenDaysAgo.setDate(currentDate.getDate() - 10);

  // Overall Progression Rate
  const progressionData = dailyMetrics.map((metric) =>
    metric.progressionRate === "N/A" ? 0 : parseFloat(metric.progressionRate)
  );

  // Fatigue Overall (unchanged for chart)
  const fatigueData = dailyMetrics.map((metric) => parseFloat(metric.fatigue));

  // Calculate maxVolumeThreshold from all logs grouped by date
  const dailyVolumes = dates.map((date) => {
    const dayLogs = logs.filter((log) => log[0] === date);
    return dayLogs.reduce(
      (sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]),
      0
    );
  });
  const maxVolumeThreshold = Math.max(...dailyVolumes, 1); // Avoid division by zero, use highest daily volume

  // Per Muscle Group Analytics
  const muscleAnalytics = muscleGroups.map((group) => {
    const groupLogs = logs.filter((log) => log[1] === group);
    const totalVolume = groupLogs.reduce(
      (sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]),
      0
    );
    const totalReps = groupLogs.reduce(
      (sum, log) => sum + parseFloat(log[3]),
      0
    );
    const totalSets = groupLogs.length;

    const avgProgression =
      groupLogs.length > 1
        ? groupLogs.reduce((sum, log, idx) => {
            if (idx === 0) return 0;
            const prevWeight = parseFloat(groupLogs[idx - 1][4]);
            const currWeight = parseFloat(log[4]);
            return (
              sum +
              (currWeight > prevWeight
                ? ((currWeight - prevWeight) / prevWeight) * 100
                : 0)
            );
          }, 0) /
          (groupLogs.length - 1)
        : 0;

    // Enhanced Fatigue per Muscle Group (Last 10 Days)
    const recentLogs = groupLogs.filter((log) => {
      const [day, month, year] = log[0].split("/"); // Assuming DD/MM/YYYY
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= tenDaysAgo && logDate <= currentDate;
    });

    // Volume Factor
    const exerciseVolumes = recentLogs.reduce((acc, log) => {
      const exercise = log[2];
      const volume = parseFloat(log[3]) * parseFloat(log[4]);
      acc[exercise] = (acc[exercise] || 0) + volume;
      return acc;
    }, {});
    const totalRecentVolume = Object.values(exerciseVolumes).reduce(
      (sum, vol) => sum + vol,
      0
    );
    const volumeFactor = (totalRecentVolume / maxVolumeThreshold) * 33.3;

    // Frequency Factor
    const workoutDays = [...new Set(recentLogs.map((log) => log[0]))].length;
    const frequencyFactor = (workoutDays / 10) * 33.3;

    // Rating Factor
    const avgRating =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + parseFloat(log[5]), 0) /
          recentLogs.length
        : 0;
    const ratingFactor = (avgRating / 10) * 33.3;

    // Rest Adjustment
    const lastWorkoutDate =
      recentLogs.length > 0
        ? new Date(
            recentLogs[recentLogs.length - 1][0].split("/").reverse().join("-")
          )
        : tenDaysAgo;
    const daysSinceLastWorkout = Math.max(
      0,
      Math.floor((currentDate - lastWorkoutDate) / (1000 * 60 * 60 * 24))
    );
    const restAdjustment = 1 - daysSinceLastWorkout / 10;

    // Total Fatigue (capped at 100%)
    const fatiguePerMuscle = Math.min(
      (volumeFactor + frequencyFactor + ratingFactor) * restAdjustment,
      100
    );

    return {
      muscleGroup: group,
      totalVolume,
      totalReps,
      totalSets,
      avgProgression,
      fatigue: fatiguePerMuscle,
    };
  });

  // Enhanced Overall Fatigue Trend
  const avgFatigue =
    muscleAnalytics.reduce((sum, m) => sum + m.fatigue, 0) /
      muscleAnalytics.length || 0;
  const fatigueTrend = avgFatigue > 50 ? "High" : "Normal";
  const musclesToExercise =
    muscleAnalytics
      .filter((m) => m.fatigue < 30)
      .map((m) => m.muscleGroup)
      .join(", ") || "None";
  const musclesToFocus =
    muscleAnalytics
      .filter((m) => m.fatigue > 70)
      .map((m) => m.muscleGroup)
      .join(", ") || "None";
  const restRecommendation = `Exercise More: ${musclesToExercise}. Focus/Rest: ${musclesToFocus}`;

  return {
    dates,
    muscleGroups,
    progressionData,
    fatigueData,
    fatigueTrend,
    restRecommendation,
    muscleAnalytics,
  };
}, [logs, dailyMetrics]);
  // Overall Progression Rate Chart
  const progressionRateData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Progression Rate (%)",
        data: processedData.progressionData || [],
        borderColor: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.main}33`,
        tension: 0.3,
      },
    ],
  };

  // Overall Fatigue Chart
  const fatigueData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Fatigue (%)",
        data: processedData.fatigueData || [],
        borderColor: theme.palette.error.main,
        backgroundColor: `${theme.palette.error.main}33`,
        tension: 0.3,
      },
    ],
  };

  // Avg Progression per Muscle Group
  const avgProgressionData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Avg Progression (%)",
        data: processedData.muscleAnalytics.map((m) => m.avgProgression) || [],
        backgroundColor: `${theme.palette.success.main}99`,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
      },
    ],
  };

  // Total Volume per Muscle Group
  const volumeByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Total Volume",
        data: processedData.muscleAnalytics.map((m) => m.totalVolume) || [],
        backgroundColor: `${theme.palette.info.main}99`,
        borderColor: theme.palette.info.main,
        borderWidth: 1,
      },
    ],
  };

  // Total Reps per Muscle Group
  const repsByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Total Reps",
        data: processedData.muscleAnalytics.map((m) => m.totalReps) || [],
        backgroundColor: `${theme.palette.warning.main}99`,
        borderColor: theme.palette.warning.main,
        borderWidth: 1,
      },
    ],
  };

  // Total Sets per Muscle Group
  const setsByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Total Sets",
        data: processedData.muscleAnalytics.map((m) => m.totalSets) || [],
        backgroundColor: `${theme.palette.secondary.main}99`,
        borderColor: theme.palette.secondary.main,
        borderWidth: 1,
      },
    ],
  };

  // Fatigue per Muscle Group (Enhanced)
  const fatigueByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Fatigue (%) - Last 10 Days",
        data: processedData.muscleAnalytics.map((m) => m.fatigue) || [],
        backgroundColor: `${theme.palette.error.main}99`,
        borderColor: theme.palette.error.main,
        borderWidth: 1,
      },
    ],
  };

  const lineChartOptions = (title, yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
    },
    scales: {
      x: { ticks: { color: theme.palette.text.secondary } },
      y: {
        ticks: { color: theme.palette.text.secondary },
        beginAtZero: true,
        title: { display: true, text: yLabel },
      },
    },
  });

  const barChartOptions = (title, yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
    },
    scales: {
      x: { ticks: { color: theme.palette.text.secondary } },
      y: {
        ticks: { color: theme.palette.text.secondary },
        beginAtZero: true,
        title: { display: true, text: yLabel },
      },
    },
  });

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
      >
        Workout Analytics
      </Typography>
      <Paper elevation={3} sx={{ p: 3, borderRadius: "10px" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Line
                data={progressionRateData}
                options={lineChartOptions(
                  "Progression Rate Over Time",
                  "Progression (%)"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Line
                data={fatigueData}
                options={lineChartOptions("Fatigue Over Time", "Fatigue (%)")}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={avgProgressionData}
                options={barChartOptions(
                  "Average Progression per Muscle Group",
                  "Progression (%)"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={volumeByMuscleData}
                options={barChartOptions(
                  "Total Volume per Muscle Group",
                  "Volume"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={repsByMuscleData}
                options={barChartOptions("Total Reps per Muscle Group", "Reps")}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={setsByMuscleData}
                options={barChartOptions("Total Sets per Muscle Group", "Sets")}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={fatigueByMuscleData}
                options={barChartOptions(
                  "Fatigue per Muscle Group (Last 7 Days)",
                  "Fatigue (%)"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Alert
              severity={
                processedData.fatigueTrend === "High" ? "warning" : "info"
              }
            >
              Overall Fatigue Trend: {processedData.fatigueTrend} -{" "}
              {processedData.restRecommendation}
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Charts;
