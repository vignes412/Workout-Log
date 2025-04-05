import React, { useMemo } from "react";
import { Radar } from "react-chartjs-2"; // Changed from Bar to Radar
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from "chart.js"; // Import required components
import { useTheme, Box } from "@mui/material";

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

const MuscleGroupDistributionChart = ({ logs }) => {
  const theme = useTheme();
  const muscleGroups = [...new Set(logs.map((log) => log[1]))];

  const muscleGroupDistributionData = useMemo(() => {
    const muscleGroupDistribution = muscleGroups.map((group) => {
      const groupLogs = logs.filter((log) => log[1] === group);
      return groupLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    const totalVolume = muscleGroupDistribution.reduce(
      (sum, volume) => sum + volume,
      0
    );
    const muscleGroupDistributionPercent = muscleGroupDistribution.map(
      (volume) => (volume / totalVolume) * 100 || 0
    );

    const brightColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#FF6384",
    ];

    return {
      labels: muscleGroups || [],
      datasets: [
        {
          label: "Volume Distribution (%)",
          data: muscleGroupDistributionPercent || [],
          backgroundColor: brightColors.map((color) => `${color}80`), // Add transparency
          borderColor: brightColors,
          borderWidth: 2,
        },
      ],
    };
  }, [logs, muscleGroups]);

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme.palette.text.primary,
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: "Muscle Group Volume Distribution",
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
    },
    scales: {
      r: {
        angleLines: { color: theme.palette.divider },
        grid: { color: theme.palette.divider },
        pointLabels: { color: theme.palette.text.primary },
        ticks: {
          color: theme.palette.text.secondary,
          beginAtZero: true,
        },
      },
    },
  };

  return (
    <Box className="chart-wrapper">
      <Radar data={muscleGroupDistributionData} options={radarChartOptions} />{" "}
      {/* Changed from Bar to Radar */}
    </Box>
  );
};

export default MuscleGroupDistributionChart;
