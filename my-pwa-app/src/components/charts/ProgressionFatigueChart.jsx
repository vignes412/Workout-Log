// src/components/charts/ProgressionFatigueChart.js
import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "@mui/material";
import { computeDailyMetrics } from "../../utils/computeDailyMetrics";

const ProgressionFatigueChart = ({ logs }) => {
  const theme = useTheme();
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);
  const combinedProgressionFatigueData = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { dates: [], progressionData: [], fatigueData: [] };
    }

    const dates = [...new Set(logs.map((log) => log[0]))].sort();

    const maxThreshold = dates.reduce((max, date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
      return Math.max(max, dateVolume);
    }, 1);

    const fatigueData = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      const dateVolume = dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
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

    return { dates, progressionData, fatigueData };
  }, [logs, dailyMetrics]);

  const chartData = {
    labels: combinedProgressionFatigueData.dates || [],
    datasets: [
      {
        label: "Progression Rate (%)",
        data: combinedProgressionFatigueData.progressionData || [],
        borderColor: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.main}33`,
        tension: 0.5,
      },
      {
        label: "Fatigue (%)",
        data: combinedProgressionFatigueData.fatigueData || [],
        borderColor: theme.palette.error.main,
        backgroundColor: `${theme.palette.error.main}33`,
        tension: 0.5,
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
        text: "Progression Rate and Fatigue Over Time",
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
          text: "Percentage (%)",
          color: theme.palette.text.primary,
        },
      },
    },
  };

  return (
    <div style={{ height: 350 }}>
      {/* Adjusted height */}
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default ProgressionFatigueChart;
