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

const Charts = ({ logs }) => {
  const dailyMetrics = computeDailyMetrics(logs);
  console.log("Daily Metrics for Charts:", dailyMetrics);

  if (!dailyMetrics || dailyMetrics.length === 0) {
    return <Typography>No data available for charts</Typography>;
  }

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 4 }}>
        Workout Summary Charts
      </Typography>
      <Grid container spacing={4}>
        {" "}
        {/* Increased spacing */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Volume Over Time
          </Typography>
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
            {" "}
            {/* Larger height */}
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
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
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
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
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
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
            <StackedBarChart data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Max Weight vs Avg Fatigue
          </Typography>
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
            <ScatterPlot data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Total Volume by Muscle Group
          </Typography>
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
            <GroupedBarChart data={dailyMetrics} />
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" gutterBottom>
            Progression Rate Over Time
          </Typography>
          <div style={{ height: 350, width: "100%", border: "1px solid #ccc" }}>
            <MultiLineChart data={dailyMetrics} />
          </div>
        </Grid>
      </Grid>
    </>
  );
};

export default Charts;
