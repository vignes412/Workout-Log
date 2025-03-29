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
    if (!logs || logs.length === 0) {
      return {
        dates: [],
        muscleGroups: [],
        fatigueData: [],
        progressionData: [],
        fatigueByMuscle: [],
        fatigueTrend: { rest: "None", workout: "None" },
      };
    }

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];

    // Calculate maxThreshold: Group by date and get the highest volume across all dates
    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]); // Assuming reps are at index 3
        const weight = parseFloat(log[4]); // Assuming weight is at index 4
        const volume = reps * weight;
        return sum + (isNaN(volume) ? 0 : volume);
      }, 0);
      return Math.max(max, dateVolume);
    }, 1); // Avoid division by zero

    // Filter logs for the last 10 days
    const currentDate = new Date();
    const tenDaysAgo = new Date(currentDate);
    tenDaysAgo.setDate(currentDate.getDate() - 10);

    const last10DaysLogs = logs.filter((log) => {
      const [day, month, year] = log[0].split("/"); // Assuming DD/MM/YYYY
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= tenDaysAgo && logDate <= currentDate;
    });

    // Fatigue per Muscle Group: Calculate fatigue based on total volume
    const fatigueByMuscle = muscleGroups.map((group) => {
      const groupLogs = last10DaysLogs.filter((log) => log[1] === group);

      // Calculate total volume (reps * weight) for the muscle group
      const totalVolume = groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]); // Assuming reps are at index 3
        const weight = parseFloat(log[4]); // Assuming weight is at index 4
        const volume = reps * weight;
        return sum + (isNaN(volume) ? 0 : volume);
      }, 0);

      // Calculate fatigue as normalized volume
      const fatigue = (totalVolume / maxThreshold) * 100; // Normalize to percentage

      return { muscleGroup: group, fatigue: Math.min(fatigue, 200) }; // Cap at 100%
    });

    // Debugging: Log intermediate results
    console.log("Fatigue by Muscle Group (Volume-Based):", fatigueByMuscle);

    // Determine Overall Fatigue Trend
    const musclesToRest = fatigueByMuscle
      .filter((m) => m.fatigue > 70) // High fatigue
      .map((m) => m.muscleGroup);

    const musclesToWorkout = fatigueByMuscle
      .filter((m) => m.fatigue < 30) // Low fatigue
      .map((m) => m.muscleGroup);

    const overallFatigueTrend = {
      rest: musclesToRest.length > 0 ? musclesToRest.join(", ") : "None",
      workout:
        musclesToWorkout.length > 0 ? musclesToWorkout.join(", ") : "None",
    };

    // Fatigue Data: Group by date and get max fatigue for each date
    const fatigueData = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]);
        const weight = parseFloat(log[4]);
        const volume = reps * weight;
        return sum + (isNaN(volume) ? 0 : volume);
      }, 0);
      return (dateVolume / maxThreshold) * 100; // Normalize to percentage
    });

    // Progression Data: Group by date and calculate average progression
    const progressionData = dates.map((date) => {
      const dayMetrics = dailyMetrics.filter((metric) => metric.date === date);
      const progressionRates = dayMetrics.map((metric) =>
        metric.progressionRate === "N/A"
          ? 0
          : parseFloat(metric.progressionRate)
      );
      return (
        progressionRates.reduce((sum, rate) => sum + rate, 0) /
        progressionRates.length
      );
    });

    return {
      dates,
      muscleGroups,
      fatigueData,
      progressionData,
      fatigueByMuscle,
      fatigueTrend: overallFatigueTrend,
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

  // Fatigue per Muscle Group Chart
  const fatigueByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Fatigue (%) - Per Muscle Group",
        data: processedData.fatigueByMuscle?.map((m) => m.fatigue) || [],
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
                data={fatigueByMuscleData}
                options={barChartOptions(
                  "Fatigue per Muscle Group",
                  "Fatigue (%)"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info">
              Muscles to Rest: {processedData.fatigueTrend?.rest || "None"}
            </Alert>
            <Alert severity="info">
              Muscles to Workout:{" "}
              {processedData.fatigueTrend?.workout || "None"}
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Charts;
