import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { DashboardVisibility, defaultVisibility } from '../components/Dashboard/dashboardUtils';
import { WorkoutLog, Exercise, LogEntry } from '../types';
import { AlertColor } from '@mui/material';

// Simplified dashboard layout without react-grid-layout
interface DashboardLayout {
  visibility: DashboardVisibility;
}

interface DashboardContextType {
  // Layout state
  layout: DashboardLayout;
  isCustomizing: boolean;
  toggleCustomizing: () => void;
  saveLayout: () => void;
  resetLayout: () => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  
  // Data
  logs: WorkoutLog[]; 
  exercises: Exercise[];
  isOffline: boolean;
  readyToTrain: string[];
  restMuscles: string[];
  
  // Derived data (memoized)
  logsAsLogEntries: LogEntry[];
  chartLogsFormat: [string, string, string, string, string, string, string?][];
  
  // Utility functions
  reloadData: () => Promise<void>;
  showToast: (message: string, severity: AlertColor) => void;
  updateWorkoutLog: (updatedLogs: Array<LogEntry | WorkoutLog>) => void;
  themeMode: 'light' | 'dark';
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
  initialLogs?: WorkoutLog[];
  initialExercises?: Exercise[];
  isOffline?: boolean;
  onShowToast?: (message: string, severity: AlertColor) => void;
  onReloadData?: () => Promise<void>;
  onUpdateLogs?: (logs: Array<LogEntry | WorkoutLog>) => void;
  themeMode?: 'light' | 'dark';
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  initialLogs = [],
  initialExercises = [],
  isOffline = false,
  onShowToast,
  onReloadData,
  onUpdateLogs,
  themeMode = 'light'
}) => {
  // Initialize layout from localStorage or use defaults - simplified without grid layouts
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const savedLayout = localStorage.getItem('dashboardLayout');
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        return {
          visibility: { ...defaultVisibility, ...parsed.visibility }
        };
      }
    } catch (e) {
      console.error("Error loading dashboard layout:", e);
    }
    return {
      visibility: defaultVisibility
    };
  });
  
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>(initialLogs);
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [readyToTrain] = useState<string[]>([]);
  const [restMuscles] = useState<string[]>([]);
  
  // Update logs and exercises when props change
  useEffect(() => {
    if (initialLogs && Array.isArray(initialLogs)) {
      console.log("DashboardContext: Updated logs with", initialLogs.length, "entries");
      setLogs(initialLogs);
    }
  }, [initialLogs]);
  
  useEffect(() => {
    if (initialExercises && Array.isArray(initialExercises)) {
      console.log("DashboardContext: Updated exercises with", initialExercises.length, "entries");
      setExercises(initialExercises);
    }
  }, [initialExercises]);
  
  // Utility functions
  const toggleCustomizing = useCallback(() => {
    setIsCustomizing(prev => !prev);
  }, []);
  
  const saveLayout = useCallback(() => {
    try {
      localStorage.setItem("dashboardLayout", JSON.stringify(layout));
      onShowToast?.("Dashboard layout saved", "success");
      setIsCustomizing(false);
    } catch (error) {
      console.error("Error saving layout:", error);
      onShowToast?.("Failed to save layout", "error");
    }
  }, [layout, onShowToast]);
  
  const resetLayout = useCallback(() => {
    setLayout({
      visibility: defaultVisibility
    });
    onShowToast?.("Layout reset successfully", "success");
  }, [onShowToast]);
  
  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [widgetId]: !prev.visibility[widgetId]
      }
    }));
  }, []);
  
  const showToast = useCallback((message: string, severity: AlertColor) => {
    onShowToast?.(message, severity);
  }, [onShowToast]);
  
  const reloadData = useCallback(async () => {
    if (onReloadData) {
      await onReloadData();
    }
  }, [onReloadData]);

  const updateWorkoutLog = useCallback((updatedLogs: Array<LogEntry | WorkoutLog>) => {
    setLogs(updatedLogs as WorkoutLog[]);
    if (onUpdateLogs) {
      onUpdateLogs(updatedLogs);
    }
    console.log("Workout logs updated:", updatedLogs.length);
  }, [onUpdateLogs]);
  
  // Memoized derived data to prevent recreating on every render
  const logsAsLogEntries = useMemo(() => 
    logs as unknown as LogEntry[], 
    [logs]
  );
  
  const chartLogsFormat = useMemo(() => 
    logs as unknown as [string, string, string, string, string, string, string?][], 
    [logs]
  );
  
  // Create memoized context value
  const contextValue = useMemo(() => ({
    layout,
    isCustomizing,
    toggleCustomizing,
    saveLayout,
    resetLayout,
    toggleWidgetVisibility,
    logs,
    exercises,
    isOffline,
    readyToTrain, 
    restMuscles,
    logsAsLogEntries,
    chartLogsFormat,
    reloadData,
    showToast,
    updateWorkoutLog,
    themeMode
  }), [
    layout, 
    isCustomizing, 
    toggleCustomizing,
    saveLayout, 
    resetLayout, 
    toggleWidgetVisibility,
    logs, 
    exercises, 
    isOffline,
    readyToTrain,
    restMuscles,
    logsAsLogEntries,
    chartLogsFormat,
    reloadData,
    showToast,
    updateWorkoutLog,
    themeMode
  ]);
  
  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};