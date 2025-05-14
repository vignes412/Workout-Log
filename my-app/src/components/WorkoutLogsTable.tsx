import React, { useMemo, useState } from "react";
import { Typography, Button, CircularProgress, Box } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { appendData, cacheData } from "../utils/sheetsApi";
import WorkoutLogModal from "../pages/WorkoutLogModal";
import config from "../config";
import { LogEntry, Exercise, WorkoutLog } from "../types";

const SPREADSHEET_ID = config.google.SPREADSHEET_ID;

interface WorkoutLogRow {
  id: number;
  date: string;
  muscleGroup: string;
  exercise: string;
  reps: number | string;
  weight: number | string;
  howIFeel: string | number;
  originalIndex: number;
}

interface WorkoutLogsTableProps {
  logs: Array<LogEntry | WorkoutLog>;
  setLogs?: (logs: Array<LogEntry | WorkoutLog>) => void;
  isOffline: boolean;
  exercises: Exercise[];
}

const WorkoutLogsTable: React.FC<WorkoutLogsTableProps> = ({ logs, setLogs, isOffline, exercises }) => {
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editLog, setEditLog] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(-1); // Default page size

  // Debug logs to verify data coming in
  React.useEffect(() => {
    console.log("WorkoutLogsTable received logs:", logs);
    console.log("WorkoutLogsTable received exercises:", exercises);
  }, [logs, exercises]);

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const workoutLogRows = useMemo(() => {
    if (!logs || !Array.isArray(logs)) {
      console.log("Logs is not an array:", logs);
      return [];
    }
    
    try {
      return logs.map((log, index) => {
        // Type guards to properly handle different log types
        if (Array.isArray(log)) {
          // It's a LogEntry (array type)
          return {
            id: index + 1,
            date: log[0] || "",
            muscleGroup: log[1] || "",
            exercise: log[2] || "",
            reps: parseReps(log[3]),
            weight: parseWeight(log[4]),
            howIFeel: log[5] || "N/A",
            originalIndex: index,
          };
        } else if (typeof log === 'object' && log !== null) {
          // It's a WorkoutLog (object type)
          const workoutLog = log as WorkoutLog;
          return {
            id: index + 1,
            date: workoutLog.date || "",
            muscleGroup: workoutLog.muscleGroup || "",
            exercise: workoutLog.exercise || "",
            reps: parseReps(workoutLog.reps),
            weight: parseWeight(workoutLog.weight),
            howIFeel: workoutLog.rating || "N/A",
            originalIndex: index,
          };
        } else {
          // Fallback for unknown log type
          console.warn("Unknown log format at index", index, log);
          return {
            id: index + 1,
            date: "",
            muscleGroup: "",
            exercise: "",
            reps: 0,
            weight: 0,
            howIFeel: "N/A",
            originalIndex: index,
          };
        }
      });
    } catch (error) {
      console.error("Error processing workout logs:", error);
      return [];
    }
  }, [logs]);

  const workoutLogColumns = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      sortable: true,
      sortComparator: (v1: string, v2: string) => {
        const date1 = new Date(v1.split("/").reverse().join("/")); // Parse dd/MM/yyyy to Date
        const date2 = new Date(v2.split("/").reverse().join("/"));
        return date1.getTime() - date2.getTime();
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
      renderCell: (params: any) => (
        <Box sx={{ display: { sm: "block" } }}>
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

  const handleEdit = (row: WorkoutLogRow) => {
    setEditLog(row);
    setEditOpen(true);
  };

  const handleDelete = async (row: WorkoutLogRow) => {
    if (!setLogs) return; // Can't delete if no setLogs function
    
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

  const handleEditSave = async (updatedRow: any, originalIndex: number) => {
    if (!setLogs) return false; // Can't edit if no setLogs function
    
    setLoading(true);
    try {
      const updatedLogs = [...logs];
      updatedLogs[originalIndex] = updatedRow;
      await updateSheet(updatedLogs, originalIndex);
      setLogs(updatedLogs);
      setEditOpen(false);
      showNotification(
        "Workout Log Updated",
        `Log has been updated successfully.`
      );
      return true;
    } catch (error) {
      console.error("Error in handleEditSave:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSheet = async (updatedLogs: Array<LogEntry | WorkoutLog>, editIndex: number | null = null) => {
    if (isOffline) return;
    try {
      if (editIndex !== null) {
        const range = `Workout_Logs!A${editIndex + 2}:F${editIndex + 2}`;
        const logEntry = updatedLogs[editIndex];
        // Convert the log entry to an array format expected by the API
        const logArray = convertLogToArray(logEntry);
        
        await (window as any).gapi.client.sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range,
          valueInputOption: "RAW",
          resource: { values: [logArray] },
        });
      } else {
        await appendData("Workout_Logs!A1:F", [
          ["Date", "Muscle Group", "Exercise", "Reps", "Weight", "Rating"],
        ]);
        
        // Convert all logs to array format before passing to appendData
        const logsArray = updatedLogs.map(log => convertLogToArray(log));
        await appendData("Workout_Logs!A2:F", logsArray);
      }
      await cacheData("/api/workout", updatedLogs);
    } catch (error) {
      console.error("Error in updateSheet:", error);
      throw error;
    }
  };
  
  // Helper function to convert a LogEntry or WorkoutLog to array format
  const convertLogToArray = (log: LogEntry | WorkoutLog): any[] => {
    if (Array.isArray(log)) {
      // It's already an array (LogEntry)
      return [...log];
    } else {
      // It's a WorkoutLog object, convert to array format
      return [
        log.date || "",
        log.muscleGroup || "",
        log.exercise || "",
        log.reps?.toString() || "0",
        log.weight?.toString() || "0",
        log.rating?.toString() || "0"
      ];
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
          rows={workoutLogRows}
          columns={workoutLogColumns}
          getRowId={(row) => row.id}
          initialState={{
            pagination: { paginationModel: { pageSize: pageSize, page: 0 } },
            sorting: { sortModel: [{ field: "date", sort: "desc" }] },
            density: "compact",
          }}
          pageSizeOptions={[-1, 5, 10, 20, 50, 100]}
          onPaginationModelChange={({ pageSize: newPageSize }) => 
            setPageSize(newPageSize || -1)
          }
          slots={{ toolbar: GridToolbar }}
          sortingOrder={["asc", "desc"]}
        />
      </div>
      {editLog && (
        <WorkoutLogModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          exercises={exercises}
          isOffline={isOffline}
          editLog={editLog}
          onSave={handleEditSave as any}
        />
      )}
    </>
  );
};

const parseReps = (value: any): number | string => 
  typeof value === 'string' && value ? value : (isNaN(parseFloat(value)) ? 0 : parseFloat(value));

const parseWeight = (value: any): number | string => 
  value === "Bodyweight" ? "Bodyweight" : (isNaN(parseFloat(value)) ? 0 : parseFloat(value));

export default WorkoutLogsTable;