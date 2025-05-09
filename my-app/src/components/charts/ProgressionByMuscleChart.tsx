import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";
import { computeDailyMetrics } from "../../utils/computeDailyMetrics";

interface ProgressionByMuscleChartProps {
  logs: [string, string, string, string, string, string, string?][];
  dailyMetrics?: any[]; // Add optional dailyMetrics prop
}

const ProgressionByMuscleChart: React.FC<ProgressionByMuscleChartProps> = ({ logs }) => {
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

  const chartData = useMemo(() => ({
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
  }), [progressionByMuscleData.labels, progressionByMuscleData.data, theme.palette.success.main]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
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
  }), [theme.palette.text.primary, theme.palette.text.secondary, theme.palette.divider]);

  return (
    <Box sx={{ height: 350 }}>
      <Bar data={chartData} options={chartOptions} />
    </Box>
  );
};

export default React.memo(ProgressionByMuscleChart);
