import React, { useMemo } from "react";
import { DataGrid, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { ArrowUpward, ArrowDownward, CompareArrows } from "@mui/icons-material";
import { computeDailyMetrics, WorkoutLog as MetricsWorkoutLog } from "../utils/computeDailyMetrics";
import { format } from "date-fns";
import { LogEntry } from "../types";
import { useDashboard } from "../context/DashboardContext";

interface WorkoutSummaryTableProps {
  logs?: LogEntry[];
  themeMode?: 'light' | 'dark';
}

// Adapter function to convert LogEntry[] to the WorkoutLog[] expected by computeDailyMetrics
const adaptLogsForMetrics = (logs: LogEntry[]): MetricsWorkoutLog[] => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    console.log("No logs to adapt for metrics");
    return [];
  }

  console.log("Adapting logs for metrics:", logs);
  
  try {
    return logs.map((log, index) => {
      // Handle both array-style logs and object-style logs
      if (Array.isArray(log)) {
        return [
          log[0] as string || "", // date
          log[1] as string || "", // muscleGroup
          log[2] as string || "", // exercise
          String(log[3] || "0"), // reps
          String(log[4] || "0"), // weight
          String(log[5] || "0"), // rating
        ];
      } else if (typeof log === 'object' && log !== null) {
        // Handle object format
        return [
          (log as any).date || "",
          (log as any).muscleGroup || "",
          (log as any).exercise || "",
          String((log as any).reps || "0"),
          String((log as any).weight || "0"),
          String((log as any).howIFeel || "0"),
        ];
      } else {
        console.error("Unknown log format at index", index, log);
        return ["", "", "", "0", "0", "0"];
      }
    });
  } catch (error) {
    console.error("Error adapting logs for metrics:", error);
    return [];
  }
};

interface DailyMetric {
  id: number;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: string | number;
  totalSets: string | number;
  totalReps: string | number;
  averageReps: string | number;
  averageWeight: string | number;
  averageFatigue: string | number;
  maxWeight: string | number;
  intensity: string | number;
  fatigue: string | number;
  howIFeel: string;
  progressionRate: string | number;
}

const WorkoutSummaryTable: React.FC<WorkoutSummaryTableProps> = ({ logs: propLogs, themeMode: propThemeMode }) => {
  // Use Dashboard context for logs and themeMode if not provided via props
  const dashboardContext = useDashboard();
  const logs = propLogs || dashboardContext.logsAsLogEntries;
  const themeMode = propThemeMode || dashboardContext.themeMode;

  const dailyMetrics = useMemo(() => computeDailyMetrics(adaptLogsForMetrics(logs)), [logs]);

  const sanitizedRows = useMemo(() => {
    return dailyMetrics.map((row, index) => {
      let formattedDate = "Invalid Date";
      try {
        const parsedDate = new Date(row.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = format(parsedDate, "yyyy-MM-dd");
        }
      } catch {
        formattedDate = "Invalid Date";
      }

      // Helper function to safely parse numeric values
      const safeParseFloat = (value: string | number | undefined): number => {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'number') return value;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      return {
        // Use row.id instead of creating a new id to avoid duplicate property
        ...row,
        date: formattedDate,
        totalVolume: safeParseFloat(typeof row.totalVolume === 'number' ? String(row.totalVolume) : row.totalVolume as string),
        totalSets: safeParseFloat(typeof row.totalSets === 'number' ? String(row.totalSets) : row.totalSets as string),
        totalReps: safeParseFloat(typeof row.totalReps === 'number' ? String(row.totalReps) : row.totalReps as string),
        averageReps: safeParseFloat(typeof row.averageReps === 'number' ? String(row.averageReps) : row.averageReps as string),
        averageWeight: safeParseFloat(typeof row.averageWeight === 'number' ? String(row.averageWeight) : row.averageWeight as string),
        averageFatigue: safeParseFloat(typeof row.averageFatigue === 'number' ? String(row.averageFatigue) : row.averageFatigue as string),
        maxWeight: safeParseFloat(typeof row.maxWeight === 'number' ? String(row.maxWeight) : row.maxWeight as string),
        intensity: safeParseFloat(typeof row.intensity === 'number' ? String(row.intensity) : row.intensity as string),
        fatigue: safeParseFloat(typeof row.fatigue === 'number' ? String(row.fatigue) : row.fatigue as string),
        howIFeel: row.howIFeel || "N/A",
        progressionRate:
          row.progressionRate === "N/A"
            ? "N/A"
            : safeParseFloat(typeof row.progressionRate === 'number' ? String(row.progressionRate) : row.progressionRate as string),
      };
    });
  }, [dailyMetrics]);

  const summaryColumns = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      sortable: true,
      sortComparator: (v1: string, v2: string) => {
        const date1 = new Date(v1);
        const date2 = new Date(v2);
        return date1.getTime() - date2.getTime();
      },
    },
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
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value;
        if (value === "N/A") {
          return (
            <span style={{ color: themeMode === "dark" ? "#90caf9" : "blue" }}>
              <CompareArrows /> N/A
            </span>
          );
        }
        const numValue = typeof value === 'number' ? value : parseFloat(value as string);
        if (numValue > 0) {
          return (
            <span style={{ color: themeMode === "dark" ? "#66bb6a" : "green" }}>
              <ArrowUpward /> {value}
            </span>
          );
        } else if (numValue < 0) {
          return (
            <span style={{ color: themeMode === "dark" ? "#ef5350" : "red" }}>
              <ArrowDownward /> {value}
            </span>
          );
        } else {
          return (
            <span style={{ color: themeMode === "dark" ? "#90caf9" : "blue" }}>
              <CompareArrows /> {value}
            </span>
          );
        }
      },
    },
  ];

  return (
    <div style={{ height: 500, width: "100%" }}>
      <DataGrid
        rows={sanitizedRows}
        columns={summaryColumns}
        initialState={{
          pagination: { paginationModel: { pageSize: -1, page: 0 } },
          sorting: { sortModel: [{ field: "date", sort: "desc" }] },
          density: "compact",
        }}
        pageSizeOptions={[-1, 5, 10, 20, 50, 100]}
        slots={{ toolbar: GridToolbar }}
        sortingOrder={["asc", "desc"]}
        filterMode="client"
        sortingMode="client"
        paginationMode="client"
      />
    </div>
  );
};

export default WorkoutSummaryTable;