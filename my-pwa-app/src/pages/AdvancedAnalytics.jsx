import React, { useMemo } from "react";
import { Box, Typography, Paper, Grid, Button } from "@mui/material";
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

const AdvancedAnalytics = ({ logs, onNavigate }) => {
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  const processedData = useMemo(() => {
    if (!logs || logs.length === 0)
      return { weeklyTrends: [], monthlyTrends: [] };

    const weeklyTrends = dailyMetrics.reduce((acc, metric) => {
      const date = new Date(metric.date);
      if (isNaN(date)) return acc; // Skip invalid dates
      const week = `${date.getFullYear()}-W${Math.ceil(
        (date.getDate() + 6 - date.getDay()) / 7
      )}`; // Calculate ISO week
      if (!acc[week]) acc[week] = { volume: 0, fatigue: 0, count: 0 };
      acc[week].volume += parseFloat(metric.totalVolume);
      acc[week].fatigue += parseFloat(metric.fatigue);
      acc[week].count += 1;
      return acc;
    }, {});

    const monthlyTrends = dailyMetrics.reduce((acc, metric) => {
      const date = new Date(metric.date);
      if (isNaN(date)) return acc; // Skip invalid dates
      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!acc[month]) acc[month] = { volume: 0, fatigue: 0, count: 0 };
      acc[month].volume += parseFloat(metric.totalVolume);
      acc[month].fatigue += parseFloat(metric.fatigue);
      acc[month].count += 1;
      return acc;
    }, {});

    return {
      weeklyTrends: Object.entries(weeklyTrends).map(([week, data]) => ({
        week,
        avgVolume: data.volume / data.count,
        avgFatigue: data.fatigue / data.count,
      })),
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        avgVolume: data.volume / data.count,
        avgFatigue: data.fatigue / data.count,
      })),
    };
  }, [logs, dailyMetrics]);

  const weeklyTrendData = {
    labels: processedData.weeklyTrends.map((trend) => trend.week),
    datasets: [
      {
        label: "Avg Volume",
        data: processedData.weeklyTrends.map((trend) => trend.avgVolume),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
      },
      {
        label: "Avg Fatigue",
        data: processedData.weeklyTrends.map((trend) => trend.avgFatigue),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const monthlyTrendData = {
    labels: processedData.monthlyTrends.map((trend) => trend.month),
    datasets: [
      {
        label: "Avg Volume",
        data: processedData.monthlyTrends.map((trend) => trend.avgVolume),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
      },
      {
        label: "Avg Fatigue",
        data: processedData.monthlyTrends.map((trend) => trend.avgFatigue),
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Advanced Analytics
      </Typography>
      <Paper elevation={3} sx={{ p: 3, borderRadius: "10px" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Weekly Trends
            </Typography>
            <Box sx={{ height: 350 }}>
              <Line data={weeklyTrendData} options={{ responsive: true }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Monthly Trends
            </Typography>
            <Box sx={{ height: 350 }}>
              <Line data={monthlyTrendData} options={{ responsive: true }} />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onNavigate("dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdvancedAnalytics;
