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
import { Typography, Box, Paper, useTheme, Grid } from "@mui/material";

// Register Chart.js components
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
  const theme = useTheme(); // Access the current theme

  // Memoized data processing for all charts
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) return {};

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];
    const exercises = [...new Set(logs.map((log) => log[2]))];

    const volumeData = dates.map((date) =>
      logs
        .filter((log) => log[0] === date)
        .reduce((sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]), 0)
    );
    const repsData = dates.map((date) =>
      logs
        .filter((log) => log[0] === date)
        .reduce((sum, log) => sum + parseFloat(log[3]), 0)
    );
    const weightData = dates.map(
      (date) =>
        logs
          .filter((log) => log[0] === date)
          .reduce((avg, log) => avg + parseFloat(log[4]), 0) /
        logs.filter((log) => log[0] === date).length
    );
    const ratingData = dates.map(
      (date) =>
        logs
          .filter((log) => log[0] === date)
          .reduce((avg, log) => avg + parseFloat(log[5] || 0), 0) /
        logs.filter((log) => log[0] === date).length
    );

    const volumeByMuscle = muscleGroups.map((group) =>
      logs
        .filter((log) => log[1] === group)
        .reduce((sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]), 0)
    );

    const repsByMuscle = muscleGroups.map((group) =>
      logs
        .filter((log) => log[1] === group)
        .reduce((sum, log) => sum + parseFloat(log[3]), 0)
    );

    const maxWeightByExercise = exercises.map((exercise) =>
      Math.max(
        ...logs
          .filter((log) => log[2] === exercise)
          .map((log) => parseFloat(log[4]) || 0)
      )
    );

    const volumeByMuscleAndExercise = muscleGroups.map((group) => ({
      label: group,
      data: exercises.map((exercise) =>
        logs
          .filter((log) => log[1] === group && log[2] === exercise)
          .reduce(
            (sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]),
            0
          )
      ),
      backgroundColor:
        themeMode === "light"
          ? `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
              Math.random() * 200
            )}, ${Math.floor(Math.random() * 200)}, 0.6)`
          : `rgba(${Math.floor(Math.random() * 200) + 55}, ${
              Math.floor(Math.random() * 200) + 55
            }, ${Math.floor(Math.random() * 200) + 55}, 0.6)`,
    }));

    const repsByMuscleOverTime = muscleGroups.map((group) => ({
      label: `${group} Reps`,
      data: dates.map((date) =>
        logs
          .filter((log) => log[0] === date && log[1] === group)
          .reduce((sum, log) => sum + parseFloat(log[3]), 0)
      ),
      borderColor:
        themeMode === "light"
          ? `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
              Math.random() * 200
            )}, ${Math.floor(Math.random() * 200)}, 1)`
          : `rgba(${Math.floor(Math.random() * 200) + 55}, ${
              Math.floor(Math.random() * 200) + 55
            }, ${Math.floor(Math.random() * 200) + 55}, 1)`,
      backgroundColor: "rgba(0, 0, 0, 0)",
      tension: 0.3,
      yAxisID: "y1",
    }));
    const weightByMuscleOverTime = muscleGroups.map((group) => ({
      label: `${group} Weight`,
      data: dates.map(
        (date) =>
          logs
            .filter((log) => log[0] === date && log[1] === group)
            .reduce((avg, log) => avg + parseFloat(log[4]), 0) /
          (logs.filter((log) => log[0] === date && log[1] === group).length ||
            1)
      ),
      borderColor:
        themeMode === "light"
          ? `rgba(${Math.floor(Math.random() * 200)}, ${Math.floor(
              Math.random() * 200
            )}, ${Math.floor(Math.random() * 200)}, 1)`
          : `rgba(${Math.floor(Math.random() * 200) + 55}, ${
              Math.floor(Math.random() * 200) + 55
            }, ${Math.floor(Math.random() * 200) + 55}, 1)`,
      backgroundColor: "rgba(0, 0, 0, 0)",
      tension: 0.3,
      yAxisID: "y",
    }));

    return {
      dates,
      muscleGroups,
      exercises,
      volumeData,
      repsData,
      weightData,
      ratingData,
      volumeByMuscle,
      repsByMuscle,
      maxWeightByExercise,
      volumeByMuscleAndExercise,
      repsByMuscleOverTime,
      weightByMuscleOverTime,
    };
  }, [logs, themeMode]);

  // Chart data configurations with theme-aware colors
  const progressOverTimeData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Total Volume (Reps x Weight)",
        data: processedData.volumeData || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}33`, // 20% opacity
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "Total Reps",
        data: processedData.repsData || [],
        borderColor: theme.palette.secondary.main,
        backgroundColor: `${theme.palette.secondary.main}33`,
        tension: 0.3,
        yAxisID: "y1",
      },
      {
        label: "Average Weight (lbs)",
        data: processedData.weightData || [],
        borderColor: theme.palette.info.main,
        backgroundColor: `${theme.palette.info.main}33`,
        tension: 0.3,
        yAxisID: "y",
      },
    ],
  };

  const volumeByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Volume by Muscle Group",
        data: processedData.volumeByMuscle || [],
        backgroundColor: `${theme.palette.primary.main}99`, // 60% opacity
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
    ],
  };

  const repsByMuscleData = {
    labels: processedData.muscleGroups || [],
    datasets: [
      {
        label: "Total Reps by Muscle Group",
        data: processedData.repsByMuscle || [],
        backgroundColor: `${theme.palette.secondary.main}99`,
        borderColor: theme.palette.secondary.main,
        borderWidth: 1,
      },
    ],
  };

  const ratingOverTimeData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Average Rating (1-10)",
        data: processedData.ratingData || [],
        borderColor: theme.palette.warning.main,
        backgroundColor: `${theme.palette.warning.main}33`,
        tension: 0.3,
      },
    ],
  };

  const maxWeightByExerciseData = {
    labels: processedData.exercises || [],
    datasets: [
      {
        label: "Max Weight by Exercise",
        data: processedData.maxWeightByExercise || [],
        backgroundColor: `${theme.palette.info.main}99`,
        borderColor: theme.palette.info.main,
        borderWidth: 1,
      },
    ],
  };

  const volumeByMuscleAndExerciseData = {
    labels: processedData.exercises || [],
    datasets: processedData.volumeByMuscleAndExercise || [],
  };

  const trendsByMuscleData = {
    labels: processedData.dates || [],
    datasets: [
      ...(processedData.repsByMuscleOverTime || []),
      ...(processedData.weightByMuscleOverTime || []),
    ],
  };

  // Chart options with theme-aware text colors
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Workout Progress Over Time",
        color: theme.palette.text.primary,
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Volume / Weight",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Reps",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
        grid: { drawOnChartArea: false },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Volume by Muscle Group",
        color: theme.palette.text.primary,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Muscle Group",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        title: {
          display: true,
          text: "Total Volume",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  const repsBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Total Reps by Muscle Group",
        color: theme.palette.text.primary,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Muscle Group",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        title: {
          display: true,
          text: "Total Reps",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  const ratingLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Average Rating Over Time",
        color: theme.palette.text.primary,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        title: {
          display: true,
          text: "Rating (1-10)",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
        min: 0,
        max: 10,
      },
    },
  };

  const maxWeightBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Max Weight by Exercise",
        color: theme.palette.text.primary,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Exercise",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        title: {
          display: true,
          text: "Weight (lbs)",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Volume by Muscle Group and Exercise",
        color: theme.palette.text.primary,
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: "Exercise",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "Total Volume",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
    },
  };

  const trendsLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: theme.palette.text.primary },
      },
      title: {
        display: true,
        text: "Reps and Weight Trends by Muscle Group",
        color: theme.palette.text.primary,
      },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Weight (lbs)",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: {
          display: true,
          text: "Reps",
          color: theme.palette.text.primary,
        },
        ticks: { color: theme.palette.text.secondary },
        grid: { drawOnChartArea: false },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Workout Analytics
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Line data={progressOverTimeData} options={lineOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Bar data={volumeByMuscleData} options={barOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Bar data={repsByMuscleData} options={repsBarOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Line data={ratingOverTimeData} options={ratingLineOptions} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Bar
                data={maxWeightByExerciseData}
                options={maxWeightBarOptions}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Bar
                data={volumeByMuscleAndExerciseData}
                options={stackedBarOptions}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <Line data={trendsByMuscleData} options={trendsLineOptions} />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Charts;
