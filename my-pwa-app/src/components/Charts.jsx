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
import { Typography, Box, Paper } from "@mui/material";

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

const Charts = ({ logs }) => {
  // Memoized data processing for all charts
  const processedData = useMemo(() => {
    if (!logs || logs.length === 0) return {};

    const dates = [...new Set(logs.map((log) => log[0]))].sort();
    const muscleGroups = [...new Set(logs.map((log) => log[1]))];
    const exercises = [...new Set(logs.map((log) => log[2]))];

    // Progress over time (volume, reps, weight)
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

    // Volume by muscle group
    const volumeByMuscle = muscleGroups.map((group) =>
      logs
        .filter((log) => log[1] === group)
        .reduce((sum, log) => sum + parseFloat(log[3]) * parseFloat(log[4]), 0)
    );

    // Reps by muscle group
    const repsByMuscle = muscleGroups.map((group) =>
      logs
        .filter((log) => log[1] === group)
        .reduce((sum, log) => sum + parseFloat(log[3]), 0)
    );

    // Max weight by exercise
    const maxWeightByExercise = exercises.map((exercise) =>
      Math.max(
        ...logs
          .filter((log) => log[2] === exercise)
          .map((log) => parseFloat(log[4]) || 0)
      )
    );

    // Stacked volume by muscle group and exercise
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
      backgroundColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, ${Math.floor(Math.random() * 255)}, 0.6)`,
    }));

    // Reps and weight trends per muscle group over time
    const repsByMuscleOverTime = muscleGroups.map((group) => ({
      label: `${group} Reps`,
      data: dates.map((date) =>
        logs
          .filter((log) => log[0] === date && log[1] === group)
          .reduce((sum, log) => sum + parseFloat(log[3]), 0)
      ),
      borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, ${Math.floor(Math.random() * 255)}, 1)`,
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
      borderColor: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
        Math.random() * 255
      )}, ${Math.floor(Math.random() * 255)}, 1)`,
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
  }, [logs]);

  // Chart data configurations
  const progressOverTimeData = {
    labels: processedData.dates || [],
    datasets: [
      {
        label: "Total Volume (Reps x Weight)",
        data: processedData.volumeData || [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
        yAxisID: "y",
      },
      {
        label: "Total Reps",
        data: processedData.repsData || [],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
        yAxisID: "y1",
      },
      {
        label: "Average Weight (lbs)",
        data: processedData.weightData || [],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
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
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
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
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
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
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
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
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
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

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Workout Progress Over Time" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Volume / Weight" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Reps" },
        grid: { drawOnChartArea: false },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Volume by Muscle Group" },
    },
    scales: {
      x: { title: { display: true, text: "Muscle Group" } },
      y: { title: { display: true, text: "Total Volume" } },
    },
  };

  const repsBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Total Reps by Muscle Group" },
    },
    scales: {
      x: { title: { display: true, text: "Muscle Group" } },
      y: { title: { display: true, text: "Total Reps" } },
    },
  };

  const ratingLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Average Rating Over Time" },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: {
        title: { display: true, text: "Rating (1-10)" },
        min: 0,
        max: 10,
      },
    },
  };

  const maxWeightBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Max Weight by Exercise" },
    },
    scales: {
      x: { title: { display: true, text: "Exercise" } },
      y: { title: { display: true, text: "Weight (lbs)" } },
    },
  };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Volume by Muscle Group and Exercise" },
    },
    scales: {
      x: { stacked: true, title: { display: true, text: "Exercise" } },
      y: { stacked: true, title: { display: true, text: "Total Volume" } },
    },
  };

  const trendsLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Reps and Weight Trends by Muscle Group" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { title: { display: true, text: "Date" } },
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Weight (lbs)" },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Reps" },
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
        <Box sx={{ mb: 4 }}>
          <Line
            data={progressOverTimeData}
            options={lineOptions}
            height={400}
          />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Bar data={volumeByMuscleData} options={barOptions} height={400} />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Bar data={repsByMuscleData} options={repsBarOptions} height={400} />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Line
            data={ratingOverTimeData}
            options={ratingLineOptions}
            height={400}
          />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Bar
            data={maxWeightByExerciseData}
            options={maxWeightBarOptions}
            height={400}
          />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Bar
            data={volumeByMuscleAndExerciseData}
            options={stackedBarOptions}
            height={400}
          />
        </Box>
        <Box>
          <Line
            data={trendsByMuscleData}
            options={trendsLineOptions}
            height={400}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Charts;
