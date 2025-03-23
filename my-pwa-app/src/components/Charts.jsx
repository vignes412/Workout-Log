import React from "react";
import { Typography, Grid } from "@mui/material";
import { computeDailyMetrics } from "../utils/computeDailyMetrics";
import LineChart from "./charts/LineChart";
import AreaChart from "./charts/AreaChart";
import BarChart from "./charts/BarChart";
import StackedBarChart from "./charts/StackedBarChart";
import ScatterPlot from "./charts/ScatterPlot";
import GroupedBarChart from "./charts/GroupedBarChart";
import MultiLineChart from "./charts/MultiLineChart";
import "../styles.css"; // Single CSS file import

const Charts = ({ logs }) => {
  const dailyMetrics = computeDailyMetrics(logs);

  if (!dailyMetrics || dailyMetrics.length === 0) {
    return <Typography>No data available for charts</Typography>;
  }

  return (
    <div className="charts-container">
      <Typography variant="h5" gutterBottom>
        Workout Summary Charts
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Volume Over Time
          </Typography>
          <div className="chart-wrapper">
            <LineChart
              data={dailyMetrics}
              field="totalVolume"
              label="Total Volume"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Reps Over Time
          </Typography>
          <div className="chart-wrapper">
            <AreaChart
              data={dailyMetrics}
              field="totalReps"
              label="Total Reps"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Sets per Date
          </Typography>
          <div className="chart-wrapper">
            <BarChart
              data={dailyMetrics}
              field="totalSets"
              label="Total Sets"
            />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Avg Reps and Weight (Stacked)
          </Typography>
          <div className="chart-wrapper">
            <StackedBarChart data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Max Weight vs Avg Fatigue
          </Typography>
          <div className="chart-wrapper">
            <ScatterPlot data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Volume by Muscle Group
          </Typography>
          <div className="chart-wrapper">
            <GroupedBarChart data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Progression Rate Over Time
          </Typography>
          <div className="chart-wrapper">
            <MultiLineChart data={dailyMetrics} />
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Charts;
