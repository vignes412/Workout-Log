import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import DashboardHeader from './Dashboard/DashboardHeader';
import ResponsiveDashboardGrid from './Dashboard/ResponsiveDashboardGrid';
import DashboardFab from './Dashboard/DashboardFab';
import { getRecentWorkoutLogs } from './Dashboard/dashboardUtils';
import { useDashboard } from '../context/DashboardContext';
import * as WidgetComponents from './Dashboard/Widgets';
import { WIDGET_IDS } from './Dashboard/dashboardUtils';
import WorkoutLogModal from '../pages/WorkoutLogModal';

// Define a type for the widget ID keys
type WidgetId = typeof WIDGET_IDS[number];

// Define a type for the widget components map
type WidgetComponentsMap = {
  [key in WidgetId]?: React.ReactNode;
} & {
  [key: string]: React.ReactNode | undefined;
};

interface DashboardProps {
  onLogout?: () => void;
  onOpenSettings?: () => void;
  handleMobileMenuOpen?: (event: React.MouseEvent<HTMLElement>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onLogout,
  onOpenSettings,
  handleMobileMenuOpen
}) => {
  const theme = useTheme();
  const { logs } = useDashboard();
  
  // Create Map of widget IDs to their respective components
  const widgetComponentsMap = useMemo<WidgetComponentsMap>(() => {
    const mapping: WidgetComponentsMap = {
      "status": <WidgetComponents.StatusWidget id="status" />,
      "train": <WidgetComponents.TrainWidget id="train" />,
      "rest": <WidgetComponents.RestWidget id="rest" />,
      "workout-features": <WidgetComponents.WorkoutFeaturesWidget id="workout-features" />,
      "workout-logs": <WidgetComponents.WorkoutLogsWidget id="workout-logs" />,
      "muscle-distribution": <WidgetComponents.MuscleDistributionWidget id="muscle-distribution" />,
      "workout-count": <WidgetComponents.WorkoutCountWidget id="workout-count" />,
      "total-volume": <WidgetComponents.TotalVolumeWidget id="total-volume" />,
      "todo-list": <WidgetComponents.TodoListWidget id="todo-list" />,
      "workout-summary": <WidgetComponents.WorkoutSummaryWidget id="workout-summary" />,
      "workout-summary-table": <WidgetComponents.WorkoutSummaryTableWidget id="workout-summary-table" />,
      "progression-fatigue": <WidgetComponents.ProgressionFatigueWidget id="progression-fatigue" />,
      "progression-muscle": <WidgetComponents.ProgressionByMuscleWidget id="progression-muscle" />,
      "volume-over-time": <WidgetComponents.VolumeOverTimeWidget id="volume-over-time" />,
      "fatigue-by-muscle": <WidgetComponents.FatigueByMuscleWidget id="fatigue-by-muscle" />,
      "progress-goals": <WidgetComponents.ProgressGoalsWidget id="progress-goals" />,
      "achievements": <WidgetComponents.AchievementsWidget id="achievements" />,
      "weekly-summary": <WidgetComponents.WeeklySummaryWidget id="weekly-summary" />,
      "monthly-summary": <WidgetComponents.MonthlySummaryWidget id="monthly-summary" />,
      "streak-tracker": <WidgetComponents.StreakTrackerWidget id="streak-tracker" />
    };
    return mapping;
  }, []);
  
  // FAB Menu state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [quickAddAnchorEl, setQuickAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const [modalEditLog, setModalEditLog] = React.useState(null);
  const [openModal, setOpenModal] = React.useState(false);
  
  // Get recent logs for quick add menu
  const recentLogs = useMemo(() => getRecentWorkoutLogs(logs), [logs]);
  
  // Handle FAB menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle quick add menu open/close
  const handleQuickAddOpen = (event: React.MouseEvent<HTMLElement>) => {
    setQuickAddAnchorEl(event.currentTarget);
    handleMenuClose();
  };

  const handleQuickAddClose = () => {
    setQuickAddAnchorEl(null);
  };
  
  // Handle quick add
  const handleQuickAdd = (log: any) => {
    setModalEditLog(log);
    setOpenModal(true);
    handleQuickAddClose();
  };

  return (
    <Box 
      className="dashboard-container"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
        padding: 2,
        boxSizing: 'border-box'
      }}
    >
      {/* Dashboard Header */}
      <DashboardHeader 
        handleMobileMenuOpen={handleMobileMenuOpen}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />
      
      {/* Dashboard Grid with all widgets */}
      <ResponsiveDashboardGrid>
        {/* Map all widget IDs to their respective components */}
        {WIDGET_IDS.map(widgetId => {
          // Handle the case where a widget might not exist in our mapping
          return widgetComponentsMap[widgetId] || null;
        })}
      </ResponsiveDashboardGrid>
      
      {/* FAB for adding workout logs */}
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
          editLog={modalEditLog || undefined}
          exercises={[]} // Add missing required prop
          isOffline={false} // Add missing required prop
        />
      )}
    </Box>
  );
};

export default React.memo(Dashboard);