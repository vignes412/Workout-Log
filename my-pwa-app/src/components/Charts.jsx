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
        volumeOverTime: [],
        muscleGroupDistributionPercent: [],
      };
    }

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];

    // Calculate maxThreshold: Group by date and get the highest volume across all dates
    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0; // Assuming reps are at index 3
        const weight = parseFloat(log[4]) || 0; // Assuming weight is at index 4
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return Math.max(max, dateVolume);
    }, 1); // Avoid division by zero

    // Filter logs for the last 10 days
    const currentDate = new Date();
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(currentDate.getDate() - 3);

    const last10DaysLogs = logs.filter((log) => {
      const [day, month, year] = log[0].split("/"); // Assuming DD/MM/YYYY
      const logDate = new Date(`${year}-${month}-${day}`);
      return logDate >= threeDaysAgo && logDate <= currentDate;
    });

    // Fatigue per Muscle Group: Calculate fatigue based on total volume
    const fatigueByMuscle = muscleGroups.map((group) => {
      const groupLogs = last10DaysLogs.filter((log) => log[1] === group);

      // Calculate total volume (reps * weight) for the muscle group
      const totalVolume = groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0; // Assuming reps are at index 3
        const weight = parseFloat(log[4]) || 0; // Assuming weight is at index 4
        const volume = reps * weight;
        return sum + volume;
      }, 0);

      // Calculate fatigue as normalized volume
      const fatigue = (totalVolume / maxThreshold) * 100 || 0; // Normalize to percentage

      return { muscleGroup: group, fatigue: Math.min(fatigue, 200) }; // Cap at 100%
    });

    // Debugging: Log intermediate results
    console.log("Fatigue by Muscle Group (Volume-Based):", fatigueByMuscle);

    // Determine Overall Fatigue Trend
    const musclesToRest = fatigueByMuscle
      .filter((m) => m.fatigue > 30) // High fatigue
      .map((m) => m.muscleGroup);

    const musclesToWorkout = fatigueByMuscle
      .filter((m) => m.fatigue < 10) // Low fatigue
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
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        const volume = reps * weight;
        return sum + volume;
      }, 0);
      return (dateVolume / maxThreshold) * 100 || 0; // Normalize to percentage
    });

    // Progression Data: Group by date and calculate average progression
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

    // Progression Rate per Muscle Group: Calculate average progression rate
    const progressionByMuscle = muscleGroups.map((group) => {
      const groupMetrics = dailyMetrics.filter(
        (metric) => metric.muscleGroup === group
      );

      // Calculate average progression rate for the muscle group
      const avgProgressionRate =
        groupMetrics.reduce((sum, metric) => {
          const rate =
            metric.progressionRate === "N/A"
              ? 0
              : parseFloat(metric.progressionRate) || 0;
          return sum + rate;
        }, 0) / (groupMetrics.length || 1);

      return { muscleGroup: group, avgProgressionRate };
    });

    // Debugging: Log intermediate results
    console.log("Progression Rate by Muscle Group:", progressionByMuscle);

    // Volume Over Time: Calculate total volume for each date
    const volumeOverTime = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      return dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    // Muscle Group Distribution: Calculate total volume per muscle group
    const muscleGroupDistribution = muscleGroups.map((group) => {
      const groupLogs = logs.filter((log) => log[1] === group);
      return groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    // Normalize muscle group distribution to percentages
    const totalVolume = muscleGroupDistribution.reduce(
      (sum, volume) => sum + volume,
      0
    );
    const muscleGroupDistributionPercent = muscleGroupDistribution.map(
      (volume) => (volume / totalVolume) * 100 || 0
    );

    return {
      dates,
      muscleGroups,
      fatigueData,
      progressionData,
      fatigueByMuscle,
      fatigueTrend: overallFatigueTrend,
      progressionByMuscle,
      volumeOverTime,
      muscleGroupDistributionPercent,
    };
  }, [logs, dailyMetrics]);

  // Combined Progression and Fatigue Over Time Chart Data
  const combinedProgressionFatigueData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Progression Rate (%)",
        data: processedData.progressionData || [],
        borderColor: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.main}33`,
        tension: 0.3,
      },
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

  // Progression Rate per Muscle Group Chart
  const progressionByMuscleData = {
    labels: processedData.progressionByMuscle.map((m) => m.muscleGroup) || [],
    datasets: [
      {
        label: "Progression Rate (%) - Per Muscle Group",
        data:
          processedData.progressionByMuscle.map((m) => m.avgProgressionRate) ||
          [],
        backgroundColor: `${theme.palette.success.main}99`,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
      },
    ],
  };

  // Volume Over Time Chart Data
  const volumeOverTimeData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Total Volume",
        data: processedData.volumeOverTime || [],
        borderColor: theme.palette.info.main,
        backgroundColor: `${theme.palette.info.main}33`,
        tension: 0.3,
      },
    ],
  };

  // Muscle Group Distribution Chart Data
  const brightColors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
  ];

  const muscleGroupDistributionData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Volume Distribution (%)",
        data: processedData.muscleGroupDistributionPercent || [],
        backgroundColor: processedData.muscleGroups.map(
          (_, i) => brightColors[i % brightColors.length]
        ),
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
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14 }, // Increased font size
        },
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
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14 }, // Increased font size
        },
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
                data={combinedProgressionFatigueData}
                options={lineChartOptions(
                  "Progression Rate and Fatigue Over Time",
                  "Percentage (%)"
                )}
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
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={progressionByMuscleData}
                options={barChartOptions(
                  "Progression Rate per Muscle Group",
                  "Progression Rate (%)"
                )}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Line
                data={volumeOverTimeData}
                options={lineChartOptions("Volume Over Time", "Total Volume")}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 350 }}>
              <Bar
                data={muscleGroupDistributionData}
                options={barChartOptions(
                  "Muscle Group Volume Distribution",
                  "Percentage (%)"
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
