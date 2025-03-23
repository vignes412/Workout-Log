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
      totalVolume: isNaN(parseFloat(row.totalVolume))
        ? 0
        : parseFloat(row.totalVolume),
      totalSets: isNaN(parseFloat(row.totalSets))
        ? 0
        : parseFloat(row.totalSets),
      totalReps: isNaN(parseFloat(row.totalReps))
        ? 0
        : parseFloat(row.totalReps),
      averageReps: isNaN(parseFloat(row.averageReps))
        ? 0
        : parseFloat(row.averageReps),
      averageWeight: isNaN(parseFloat(row.averageWeight))
        ? 0
        : parseFloat(row.averageWeight),
      averageFatigue: isNaN(parseFloat(row.averageFatigue))
        ? 0
        : parseFloat(row.averageFatigue),
      maxWeight: isNaN(parseFloat(row.maxWeight))
        ? 0
        : parseFloat(row.maxWeight),
      intensity:
        row.intensity === "N/A"
          ? "N/A"
          : isNaN(parseFloat(row.intensity))
          ? 0
          : parseFloat(row.intensity), // New field
      howIFeel: row.howIFeel || "N/A", // New field
      progressionRate:
        row.progressionRate === "N/A"
          ? "N/A"
          : isNaN(parseFloat(row.progressionRate))
          ? 0
          : parseFloat(row.progressionRate),
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
    }, // New column
    { field: "howIFeel", headerName: "How I Feel", width: 120, sortable: true }, // New column
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
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={sanitizedRows}
          columns={summaryColumns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
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
