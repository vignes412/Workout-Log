// src/components/WorkoutSummaryTable/WorkoutSummaryTable.jsx
import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ArrowUpward, ArrowDownward, CompareArrows } from "@mui/icons-material";
import { computeDailyMetrics } from "../utils/computeDailyMetrics";

const WorkoutSummaryTable = ({ logs }) => {
  const dailyMetrics = useMemo(() => computeDailyMetrics(logs), [logs]);

  const sanitizedRows = useMemo(() => {
    return dailyMetrics.map((row) => ({
      ...row,
      totalVolume: parseFloat(row.totalVolume),
      totalSets: parseFloat(row.totalSets),
      totalReps: parseFloat(row.totalReps),
      averageReps: parseFloat(row.averageReps),
      averageWeight: parseFloat(row.averageWeight),
      averageFatigue: parseFloat(row.averageFatigue),
      maxWeight: parseFloat(row.maxWeight),
      intensity: parseFloat(row.intensity),
      fatigue: parseFloat(row.fatigue),
      howIFeel: row.howIFeel || "N/A",
      progressionRate:
        row.progressionRate === "N/A" ? "N/A" : parseFloat(row.progressionRate),
    }));
  }, [dailyMetrics]);

  const summaryColumns = [
    { field: "date", headerName: "Date", width: 120, sortable: true },
    {
      field: "muscleGroup",
      headerName: "Muscle Group",
      width: 150,
      sortable: true,
    },
    { field: "exercise", headerName: "Exercise", width: 150, sortable: true },
    {
      field: "totalVolume",
      headerName: "Total Volume",
      width: 120,
      sortable: true,
    },
    {
      field: "totalSets",
      headerName: "Total Sets",
      width: 100,
      sortable: true,
    },
    {
      field: "totalReps",
      headerName: "Total Reps",
      width: 100,
      sortable: true,
    },
    {
      field: "averageReps",
      headerName: "Avg Reps",
      width: 100,
      sortable: true,
    },
    {
      field: "averageWeight",
      headerName: "Avg Weight",
      width: 120,
      sortable: true,
    },
    {
      field: "averageFatigue",
      headerName: "Avg Fatigue",
      width: 120,
      sortable: true,
    },
    {
      field: "maxWeight",
      headerName: "Max Weight",
      width: 120,
      sortable: true,
    },
    {
      field: "intensity",
      headerName: "Intensity (%)",
      width: 120,
      sortable: true,
    },
    { field: "fatigue", headerName: "Fatigue (%)", width: 120, sortable: true },
    { field: "howIFeel", headerName: "How I Feel", width: 120, sortable: true },
    {
      field: "progressionRate",
      headerName: "Progression Rate (%)",
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const value = params.value;
        if (value === "N/A") {
          return (
            <span style={{ color: "blue" }}>
              <CompareArrows /> N/A
            </span>
          );
        }
        const numValue = parseFloat(value);
        if (numValue > 0) {
          return (
            <span style={{ color: "green" }}>
              <ArrowUpward /> {value}
            </span>
          );
        } else if (numValue < 0) {
          return (
            <span style={{ color: "red" }}>
              <ArrowDownward /> {value}
            </span>
          );
        } else {
          return (
            <span style={{ color: "blue" }}>
              <CompareArrows /> {value}
            </span>
          );
        }
      },
    },
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Workout Summary by Date, Muscle Group, and Exercise
      </Typography>
      <div style={{ height: "50vh", width: "100%" }}>
        <DataGrid
          rows={sanitizedRows}
          columns={summaryColumns}
          initialState={{
            pagination: { paginationModel: { pageSize: -1, page: 0 } },
            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
            density: "compact",
          }}
          pageSizeOptions={[5, 10, 20]}
          slots={{ toolbar: GridToolbar }}
          sortingOrder={["asc", "desc"]}
          filterMode="client"
          sortingMode="client"
          paginationMode="client"
        />
      </div>
    </>
  );
};

export default WorkoutSummaryTable;
