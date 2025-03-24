import React, { useMemo, useState } from "react";
import { Typography, Button } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { appendData, cacheData } from "../utils/sheetsApi";
import WorkoutLogModal from "../WorkoutLogModal";
import config from "../config";

const SPREADSHEET_ID = config.google.SPREADSHEET_ID; // Replace with your spreadsheet ID

const WorkoutLogsTable = ({ logs, setLogs, isOffline, exercises }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);

  const workoutLogRows = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return [];
    return logs.map((log, index) => ({
      id: index + 1,
      date: log[0] || "",
      muscleGroup: log[1] || "",
      exercise: log[2] || "",
      reps: parseReps(log[3]),
      weight: parseWeight(log[4]),
      howIFeel: log[5] || "N/A",
      originalIndex: index,
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
    { field: "howIFeel", headerName: "How I Feel", width: 120, sortable: true },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <>
          <Button
            onClick={() => handleEdit(params.row)}
            disabled={isOffline || editOpen}
          >
            Edit
          </Button>
          <Button onClick={() => handleDelete(params.row)} disabled={isOffline}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  const handleEdit = (row) => {
    setEditLog(row);
    setEditOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      const updatedLogs = logs.filter(
        (_, index) => index !== row.originalIndex
      );
      await updateSheet(updatedLogs);
      setLogs(updatedLogs);
    }
  };

  const handleEditSave = async (updatedRow, originalIndex) => {
    try {
      console.log("Saving edited row:", updatedRow, "at index:", originalIndex);
      const updatedLogs = [...logs];
      updatedLogs[originalIndex] = updatedRow;
      await updateSheet(updatedLogs, originalIndex);
      setLogs(updatedLogs);
      setEditOpen(false);
    } catch (error) {
      console.error("Error in handleEditSave:", error.message, error.stack);
      throw error;
    }
  };

  const updateSheet = async (updatedLogs, editIndex = null) => {
    if (isOffline) return;

    try {
      if (editIndex !== null) {
        const range = `Workout_Logs!A${editIndex + 2}:F${editIndex + 2}`;
        console.log("Updating single row:", {
          spreadsheetId: SPREADSHEET_ID,
          range,
          values: [updatedLogs[editIndex]],
        });
        const response =
          await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: "RAW",
            resource: { values: [updatedLogs[editIndex]] },
          });
        console.log("Update response:", response);
      } else {
        console.log("Rewriting entire sheet with:", updatedLogs);
        await appendData("Workout_Logs!A1:F", [
          ["Date", "Muscle Group", "Exercise", "Reps", "Weight", "Rating"],
        ]);
        await appendData("Workout_Logs!A2:F", updatedLogs);
      }
      await cacheData("/api/workout", updatedLogs);
    } catch (error) {
      console.error("Error in updateSheet:", error.message, error.stack);
      throw error;
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Workout Logs
      </Typography>
      <div style={{ height: 400, width: "100%", marginBottom: 20 }}>
        <DataGrid
          rows={workoutLogRows}
          columns={workoutLogColumns}
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

      <WorkoutLogModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        exercises={exercises}
        isOffline={isOffline}
        editLog={editLog}
        onSave={handleEditSave}
      />
    </>
  );
};

const parseReps = (value) => (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
const parseWeight = (value) =>
  isNaN(parseFloat(value)) ? 0 : parseFloat(value);

export default WorkoutLogsTable;
