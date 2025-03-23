import React, { useMemo } from "react";
import { Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const WorkoutLogsTable = ({ logs }) => {
  const workoutLogRows = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return logs.map((log, index) => ({
      id: index + 1,
      date: log[0] || "",
      muscleGroup: log[1] || "",
      exercise: log[2] || "",
      reps: isNaN(parseFloat(log[3])) ? 0 : parseFloat(log[3]),
      weight: isNaN(parseFloat(log[4])) ? 0 : parseFloat(log[4]),
      howIFeel: log[5] || "N/A", // Replaced rating with howIFeel
    }));
  }, [logs]);

  const workoutLogColumns = [
    { field: "date", headerName: "Date", width: 120, sortable: true },
    {
      field: "muscleGroup",
      headerName: "Muscle Group",
      width: 150,
      sortable: true,
    },
    { field: "exercise", headerName: "Exercise", width: 150, sortable: true },
    { field: "reps", headerName: "Reps", width: 100, sortable: true },
    { field: "weight", headerName: "Weight", width: 100, sortable: true },
    { field: "howIFeel", headerName: "How I Feel", width: 120, sortable: true }, // Updated column
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Workout Logs
      </Typography>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid
          rows={workoutLogRows}
          columns={workoutLogColumns}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
            sorting: { sortModel: [{ field: "date", sort: "desc" }] }, // Default sort desc
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

export default WorkoutLogsTable;
