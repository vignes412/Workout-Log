import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper, useTheme, Container, Divider } from '@mui/material';
import AppLayout from '../components/AppLayout';
import { DashboardWidgets, DashboardHeader } from '../components/Dashboard/index';
import { DashboardProvider } from '../context/DashboardContext';
import WorkoutLogModal from './WorkoutLogModal';
import { useAppState } from '../index';
import { getRecentWorkoutLogs } from '../components/Dashboard/dashboardUtils';
import DashboardFab from '../components/Dashboard/DashboardFab';

// Define props interface for Dashboard component with optional props
interface DashboardProps {
  themeMode?: 'light' | 'dark';
  onNavigate?: (page: string) => void;
  accessToken?: string | null;
  isAuthenticated?: boolean;
  setIsAuthenticated?: (isAuthenticated: boolean) => void;
  toggleTheme?: () => void;
  onLogout?: () => void;
  settingsOpen?: boolean;
  isLoading?: {
    logs: boolean;
    exercises: boolean;
    [key: string]: boolean;
  };
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { state } = useAppState();
  const theme = useTheme();
  
  // Use props if provided, otherwise fall back to context values
  const themeMode = props?.themeMode || state.themeMode || 'light';
  const onNavigate = props?.onNavigate || ((page: string) => {});
  const onLogout = props?.onLogout || (() => {});
  
  const isOffline = !navigator.onLine;
  
  // State for modals and menus
  const [openModal, setOpenModal] = useState(false);
  const [modalEditLog, setModalEditLog] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Show toast function for the DashboardProvider
  const showToast = useCallback((message: string, severity: any) => {
    // This function would show a toast notification
    // For now, just log to console
    console.log(`[${severity}] ${message}`);
  }, []);

  // Reload data handler for the DashboardProvider
  const handleReloadData = useCallback(async () => {
    try {
      // Reload logic would go here
      console.log("Reloading data...");
      return Promise.resolve();
    } catch (error) {
      console.error("Error reloading data:", error);
      return Promise.reject(error);
    }
  }, []);
  
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleQuickAddOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickAddAnchorEl(event.currentTarget);
  };

  const handleQuickAddClose = () => {
    setQuickAddAnchorEl(null);
  };
  
  const handleQuickAdd = (log: any) => {
    setModalEditLog(log);
    setOpenModal(true);
    handleQuickAddClose();
  };
  
  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };
  
  const handleMobileMenuOpen = () => {
    // Implement mobile menu open handler
  };
  
  // Get recent logs for quick add menu
  const recentLogs = getRecentWorkoutLogs(state.logs || []);

  // The dashboard content
  return (
    <AppLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <DashboardProvider
          initialLogs={state.logs || []}
          initialExercises={state.exercises || []}
          isOffline={isOffline}
          onShowToast={showToast}
          onReloadData={handleReloadData}
          themeMode={themeMode}
        >
          {/* Dashboard Header with Material UI Paper */}
          <DashboardHeader 
            handleMobileMenuOpen={handleMobileMenuOpen}
            onLogout={onLogout}
            onOpenSettings={handleOpenSettings}
          />
          
          {/* Main Dashboard Widgets Section */}
          <Box sx={{ mt: 3 }}>
            <DashboardWidgets />
          </Box>
          
          {/* FAB for adding workouts */}
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
          
          {/* Workout Log Modal */}
          {openModal && (
            <WorkoutLogModal 
              open={openModal}
              onClose={() => setOpenModal(false)}
              editLog={modalEditLog}
              exercises={state.exercises || []}
              isOffline={isOffline}
            />
          )}
        </DashboardProvider>
      </Container>
    </AppLayout>
  );
};

export default React.memo(Dashboard);