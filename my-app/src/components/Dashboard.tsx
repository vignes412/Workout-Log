import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Snackbar,
  CircularProgress,
  useTheme,
  Alert,
  AlertColor
} from "@mui/material";
import { useAppState } from "../index";
import { useWorkoutLogs, useExerciseLibrary } from "../hooks/dataHooks";
import WorkoutLogModal, { EditLog } from "../pages/WorkoutLogModal";
import SettingsModal from "./SettingsModal";

// Import dashboard components
import {
  DashboardHeader,
  DashboardSidebar,
  DashboardGrid,
  DashboardWidgets,
  DashboardFab,
  getRecentWorkoutLogs,
  defaultVisibility
} from "./Dashboard/index";

// Import dashboard styles
import "../styles/dashboard.css";

// Import context provider
import { DashboardProvider } from "../context/DashboardContext";

// Import types
import { 
  NavigationProps, 
  WorkoutLog,
  AppState,
  AppAction,
  DashboardLayout
} from "../types";

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface DashboardProps extends NavigationProps {
  isAuthenticated?: boolean;
  setIsAuthenticated?: (isAuthenticated: boolean) => void;
  accessToken: string | null;
  onNavigate: (page: string) => void;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark';
  onLogout?: () => void;
  settingsOpen?: boolean;
  isLoading?: {
    logs: boolean;
    exercises: boolean;
    [key: string]: boolean;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  accessToken, 
  toggleTheme, 
  themeMode 
}) => {
  const { state, dispatch } = useAppState() as {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
  };
  
  const { isAuthenticated, currentPage } = state;
  
  // Use custom hooks for data
  const { 
    data: logs, 
    isLoading: logsLoading,
    refreshData: refreshLogs 
  } = useWorkoutLogs();
  
  const { 
    data: exercises, 
    isLoading: exercisesLoading,
    refreshData: refreshExercises 
  } = useExerciseLibrary();
  
  // Dashboard state for UI
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalEditLog, setModalEditLog] = useState<EditLog | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Track refresh operations in progress
  const refreshInProgressRef = React.useRef<boolean>(false);

  const theme = useTheme();
  
  // Calculate data that isn't dependent on rendering
  const [readyToTrain, setReadyToTrain] = useState<string[]>([]);
  const [restMuscles, setRestMuscles] = useState<string[]>([]);
  
  // Dashboard layout - simplified without DEFAULT_LAYOUTS
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>({
    visibility: defaultVisibility
  });
  
  // Show toast notification
  const showToast = useCallback((message: string, severity: AlertColor = "info") => {
    setToast({ open: true, message, severity });
  }, []);
  
  // Mobile menu handler
  const handleMobileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuOpen(true);
  }, []);
  
  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);
  
  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Data reload handler
  const handleReloadData = useCallback(async () => {
    if (refreshInProgressRef.current) {
      showToast("Data refresh already in progress", "info");
      return;
    }
    
    refreshInProgressRef.current = true;
    
    try {
      showToast("Refreshing dashboard data...", "info");
      
      await Promise.all([
        refreshLogs().catch(err => { 
          console.error("Error refreshing logs:", err);
          throw new Error("Failed to refresh workout logs"); 
        }),
        refreshExercises().catch(err => { 
          console.error("Error refreshing exercises:", err);
          throw new Error("Failed to refresh exercise library"); 
        })
      ]);
      
      showToast("Dashboard data refreshed successfully!", "success");
    } catch (error) {
      console.error("Error reloading data:", error);
      showToast(`Failed to reload data: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [refreshLogs, refreshExercises, showToast]);

  // Menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => 
    setAnchorEl(event.currentTarget), []);
    
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setQuickAddAnchorEl(null);
  }, []);

  const handleQuickAddOpen = useCallback((event: React.MouseEvent<HTMLElement>) =>
    setQuickAddAnchorEl(event.currentTarget), []);
    
  const handleQuickAddClose = useCallback(() => setQuickAddAnchorEl(null), []);

  // Handle quick add from recent logs
  const handleQuickAdd = useCallback((recentLog: WorkoutLog) => {
    setModalEditLog(recentLog as unknown as EditLog);
    setOpenModal(true);
    handleQuickAddClose();
  }, [handleQuickAddClose]);

  // Update layout
  const handleUpdateLayout = useCallback((updater: (prevLayout: any) => any) => {
    setCurrentLayout(prevLayout => {
      const newLayout = typeof updater === 'function' ? updater(prevLayout) : updater;
      return newLayout;
    });
  }, []);
  
  // Reset to default layout - simplified without DEFAULT_LAYOUTS
  const handleResetLayout = useCallback(() => {
    setCurrentLayout({
      visibility: defaultVisibility
    });
    showToast("Layout reset successfully", "success");
  }, [showToast]);

  // Recent logs for quick add menu
  const recentLogs = logs ? getRecentWorkoutLogs(logs) : [];
  
  // Check user authentication
  if (!isAuthenticated) {
    onNavigate("login");
    return null;
  }

  // Show loading state
  if (logsLoading || exercisesLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Main dashboard render - now wrapped with our context provider
  return (
    <DashboardProvider 
      initialLogs={logs}
      initialExercises={exercises}
      isOffline={isOffline}
      onShowToast={showToast}
      onReloadData={handleReloadData}
      onUpdateLogs={async (updatedLogs) => {
        console.log("Updating logs from DashboardProvider:", updatedLogs.length);
        // Refresh logs after update
        await refreshLogs();
      }}
      themeMode={themeMode}
    >
      <DashboardSidebar 
        onNavigate={onNavigate} 
        currentPage={currentPage || "dashboard"}
      />

      <Box className={`main-container ${theme.palette.mode}`}>
        <DashboardHeader
          handleMobileMenuOpen={handleMobileMenuOpen}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={() => {
            if (state.isAuthenticated) {
              // Dispatch logout action with the required payload property
              dispatch({ 
                type: "LOGOUT", 
                payload: null // Adding the required payload property
              });
              // Navigate to login page
              onNavigate("login");
              showToast("Logged out successfully", "success");
            }
          }}
        />

        <DashboardGrid>
          <DashboardWidgets />
        </DashboardGrid>

        <DashboardFab 
          handleMenuOpen={handleMenuOpen}
          anchorEl={anchorEl}
          handleMenuClose={handleMenuClose}
          setModalEditLog={setModalEditLog}
          setOpenModal={setOpenModal}
          handleQuickAddOpen={handleQuickAddOpen}
          quickAddAnchorEl={quickAddAnchorEl}
          handleQuickAddClose={handleQuickAddClose}
          recentLogs={recentLogs}
          handleQuickAdd={handleQuickAdd}
        />

        <WorkoutLogModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setModalEditLog(null);
          }}
          exercises={exercises || []}
          isOffline={isOffline}
          editLog={modalEditLog as EditLog | undefined}
          onSave={async () => {
            try {
              showToast("Workout logged successfully!", "success");
              
              // Refresh logs after saving
              await refreshLogs();
              
              setOpenModal(false);
              setModalEditLog(null);
            } catch (error) {
              console.error("Error in WorkoutLogModal onSave callback:", error);
              showToast(`Failed to process workout log: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
            }
          }}
        />
        
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onUpdateLayout={handleUpdateLayout}
          onResetLayout={handleResetLayout}
          layout={currentLayout}
        />
      </Box>
      
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </DashboardProvider>
  );
};

export default React.memo(Dashboard);