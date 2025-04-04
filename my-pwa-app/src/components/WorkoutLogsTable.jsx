import React, { useMemo, useState } from "react";
import { Typography, Button, CircularProgress, Box } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { appendData, cacheData } from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import config from "../config";
import { format } from "date-fns"; // Add this import for date formatting

const SPREADSHEET_ID = config.google.SPREADSHEET_ID;

const WorkoutLogsTable = ({ logs, setLogs, isOffline, exercises }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [loading, setLoading] = useState(false);

  // Request notification permission when the component mounts
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const workoutLogRows = useMemo(() => {
    if (!logs || !Array.isArray(logs)) return []; // Ensure logs is an array
    return logs.map((log, index) => ({
      id: index + 1, // Ensure each row has a unique id
      date: log[0] || "",
      muscleGroup: log[1] || "",
      exercise: log[2] || "",
      reps: parseReps(log[3]),
      weight: parseWeight(log[4]),
      howIFeel: log[5] || "N/A",
      originalIndex: index,
    }));
  }, [logs]);

  const formattedLogs = logs.map((log) => {
    let formattedDate = "Invalid Date";
    try {
      const parsedDate = new Date(log.date);
      if (!isNaN(parsedDate)) {
        formattedDate = format(parsedDate, "dd/MM/yyyy"); // Format date to dd/MM/yyyy
      }
    } catch {
      formattedDate = "Invalid Date"; // Fallback for invalid dates
    }

    return {
      ...log,
      date: formattedDate, // Use formatted or fallback date
    };
  });

  const workoutLogColumns = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      sortable: true,
      sortComparator: (v1, v2) => {
        const date1 = new Date(v1.split("/").reverse().join("/")); // Parse dd/MM/yyyy to Date
        const date2 = new Date(v2.split("/").reverse().join("/"));
        return date1 - date2;
      },
    },
    { field: "muscleGroup", headerName: "Muscle", width: 120, sortable: true },
    { field: "exercise", headerName: "Exercise", width: 120, sortable: true },
    { field: "reps", headerName: "Reps", width: 80, sortable: true },
    { field: "weight", headerName: "Weight", width: 80, sortable: true },
    { field: "howIFeel", headerName: "Feel", width: 100, sortable: true },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          {" "}
          {/* Hide on mobile */}
          <Button
            onClick={() => handleEdit(params.row)}
            disabled={isOffline || editOpen || loading}
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(params.row)}
            disabled={isOffline || loading}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  const handleEdit = (row) => {
    setEditLog(row);
    setEditOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      setLoading(true);
      try {
        const updatedLogs = logs.filter(
          (_, index) => index !== row.originalIndex
        );
        await updateSheet(updatedLogs);
        setLogs(updatedLogs);
        showNotification(
          "Workout Log Deleted",
          `Log for ${row.date}, ${row.exercise} has been deleted.`
        );
      } catch (error) {
        console.error("Error deleting log:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditSave = async (updatedRow, originalIndex) => {
    setLoading(true);
    try {
      const updatedLogs = [...logs];
      updatedLogs[originalIndex] = updatedRow;
      await updateSheet(updatedLogs, originalIndex);
      setLogs(updatedLogs);
      setEditOpen(false);
      showNotification(
        "Workout Log Updated",
        `Log for ${updatedRow.join(",")} has been updated.`
      );
    } catch (error) {
      console.error("Error in handleEditSave:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSheet = async (updatedLogs, editIndex = null) => {
    if (isOffline) return;
    try {
      if (editIndex !== null) {
        const range = `Workout_Logs!A${editIndex + 2}:F${editIndex + 2}`;
        await window.gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range,
          valueInputOption: "RAW",
          resource: { values: [updatedLogs[editIndex]] },
        });
      } else {
        await appendData("Workout_Logs!A1:F", [
          ["Date", "Muscle Group", "Exercise", "Reps", "Weight", "Rating"],
        ]);
        await appendData("Workout_Logs!A2:F", updatedLogs);
      }
      await cacheData("/api/workout", updatedLogs);
    } catch (error) {
      console.error("Error in updateSheet:", error);
      throw error;
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Workout Logs
      </Typography>
      {loading && (
        <CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />
      )}
      <div style={{ height: 400, width: "100%", marginBottom: 20 }}>
        <DataGrid
          rows={workoutLogRows} // Use rows with unique ids
          columns={workoutLogColumns}
          getRowId={(row) => row.id} // Specify custom id for each row
          initialState={{
            pagination: { paginationModel: { pageSize: -1, page: 0 } },
            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
            density: "compact",
          }}
          pageSizeOptions={[5, 10, 20]}
          pagination
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
