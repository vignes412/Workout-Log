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
import { Typography, Box, useTheme, Grid, Alert } from "@mui/material";
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
    if (!logs || logs.length === 0) {
      return {
        dates: [],
        muscleGroups: [],
        fatigueData: [],
        progressionData: [],
        fatigueTrend: { rest: "None", workout: "None" },
        progressionByMuscle: [],
      };
    }

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];

    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return Math.max(max, dateVolume);
    }, 1);

    const currentDate = new Date();
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(currentDate.getDate() - 3);

    const last10DaysLogs = logs.filter((log) => {
      const [day, month, year] = log[0].split("/");
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= threeDaysAgo && logDate <= currentDate;
    });

    const fatigueByMuscle = muscleGroups.map((group) => {
      const groupLogs = last10DaysLogs.filter((log) => log[1] === group);
      const totalVolume = groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      const fatigue = (totalVolume / maxThreshold) * 100 || 0;
      return { muscleGroup: group, fatigue: Math.min(fatigue, 200) };
    });

    const musclesToRest = fatigueByMuscle
      .filter((m) => m.fatigue > 30)
      .map((m) => m.muscleGroup);

    const musclesToWorkout = fatigueByMuscle
      .filter((m) => m.fatigue < 10)
      .map((m) => m.muscleGroup);

    const overallFatigueTrend = {
      rest: musclesToRest.length > 0 ? musclesToRest.join(", ") : "None",
      workout:
        musclesToWorkout.length > 0 ? musclesToWorkout.join(", ") : "None",
    };

    const fatigueData = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return (dateVolume / maxThreshold) * 100 || 0;
    });

    const progressionData = dates.map((date) => {
      const dayMetrics = dailyMetrics.filter((metric) => metric.date === date);
      const progressionRates = dayMetrics.map((metric) =>
        metric.progressionRate === "N/A"
          ? 0
          : parseFloat(metric.progressionRate) || 0
      );
      return (
        progressionRates.reduce((sum, rate) => sum + rate, 0) /
        (progressionRates.length || 1)
      );
    });

    const progressionByMuscle = []; // Removed calculation logic

    return {
      dates,
      muscleGroups,
      fatigueData,
      progressionData,
      fatigueTrend: overallFatigueTrend,
      progressionByMuscle,
    };
  }, [logs, dailyMetrics]);

  const lineChartOptions = (title, yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme.palette.text.primary, // Adjusted for dark mode
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary, // Adjusted for dark mode
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.secondary }, // Adjusted for dark mode
        grid: { color: theme.palette.divider }, // Adjusted for dark mode
      },
      y: {
        ticks: { color: theme.palette.text.secondary }, // Adjusted for dark mode
        grid: { color: theme.palette.divider }, // Adjusted for dark mode
        beginAtZero: true,
        title: {
          display: true,
          text: yLabel,
          color: theme.palette.text.primary,
        }, // Adjusted for dark mode
      },
    },
  });

  const barChartOptions = (title, yLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme.palette.text.primary, // Adjusted for dark mode
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary, // Adjusted for dark mode
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.secondary }, // Adjusted for dark mode
        grid: { color: theme.palette.divider }, // Adjusted for dark mode
      },
      y: {
        ticks: { color: theme.palette.text.secondary }, // Adjusted for dark mode
        grid: { color: theme.palette.divider }, // Adjusted for dark mode
        beginAtZero: true,
        title: {
          display: true,
          text: yLabel,
          color: theme.palette.text.primary,
        }, // Adjusted for dark mode
      },
    },
  });

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info">
            Muscles to Rest: {processedData.fatigueTrend?.rest || "None"}
          </Alert>
          <Alert severity="info">
            Muscles to Workout: {processedData.fatigueTrend?.workout || "None"}
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Charts;
