import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@mui/material";
import { computeDailyMetrics } from "../../utils/computeDailyMetrics";

const ProgressionByMuscleChart = ({ logs }) => {
  const theme = useTheme();
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  const progressionByMuscleData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { labels: [], data: [] };
    }

    const muscleGroups = [...new Set(logs.map((log) => log[1]))];

    const progressionByMuscle = muscleGroups.map((group) => {
      const groupMetrics = dailyMetrics.filter(
        (metric) => metric.muscleGroup === group
      );
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

    return {
      labels: progressionByMuscle.map((m) => m.muscleGroup),
      data: progressionByMuscle.map((m) => m.avgProgressionRate),
    };
  }, [logs, dailyMetrics]);

  const chartData = {
    labels: progressionByMuscleData.labels,
    datasets: [
      {
        label: "Progression Rate (%) - Per Muscle Group",
        data: progressionByMuscleData.data,
        backgroundColor: `${theme.palette.success.main}99`,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
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
        text: "Progression Rate per Muscle Group",
        color: theme.palette.text.primary,
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
      },
      y: {
        ticks: { color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
        beginAtZero: true,
        title: {
          display: true,
          text: "Progression Rate (%)",
          color: theme.palette.text.primary,
        },
      },
    },
  };

  return (
    <div style={{ height: 350 }}>
      {" "}
      {/* Adjusted height */}
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default ProgressionByMuscleChart;
