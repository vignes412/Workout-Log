import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useTheme, Box } from "@mui/material";

const VolumeOverTimeChart = ({ logs }) => {
  const theme = useTheme();
  const dates = [...new Set(logs.map((log) => log[0]))].sort();

  const volumeOverTimeData = useMemo(() => {
    const volumeOverTime = dates.map((date) => {
      const dateLogs = logs.filter((log) => log[0] === date);
      return dateLogs.reduce((sum, log) => {
        const reps = parseFloat(log[3]) || 0;
        const weight = parseFloat(log[4]) || 0;
        return sum + reps * weight;
      }, 0);
    });

    return {
      labels: dates || [],
      datasets: [
        {
          label: "Total Volume",
          data: volumeOverTime || [],
          borderColor: theme.palette.info.main,
          backgroundColor: `${theme.palette.info.main}33`,
          tension: 0.3,
        },
      ],
    };
  }, [logs, dates, theme]);

  const lineChartOptions = {
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
        text: "Volume Over Time",
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
          text: "Total Volume",
          color: theme.palette.text.primary,
        },
      },
    },
  };

  return (
    <Box className="chart-wrapper" style={{ height: 350 }}>
      <Line data={volumeOverTimeData} options={lineChartOptions} />
    </Box>
  );
};

export default VolumeOverTimeChart;
