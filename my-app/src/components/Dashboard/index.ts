// Export all Dashboard components from a single file
export { default as DashboardHeader } from './DashboardHeader';
export { default as DashboardSidebar } from './DashboardSidebar';
export { default as DashboardGrid } from './DashboardGrid';
export { default as DashboardWidgets } from './DashboardWidgets';
export { default as DashboardFab } from './DashboardFab';
export { default as BodyWeightCard } from './BodyWeightCard';
export { StatusCard, TrainMusclesCard, RestMusclesCard } from './StatusCards';
export { HighlightMetricCard, ChartCard } from './DashboardCards';
export { 
  WIDGET_IDS, 
  defaultVisibility, 
  getRecentWorkoutLogs
} from './dashboardUtils';

// Export DashboardProvider from the context directory
export { DashboardProvider } from '../../context/DashboardContext';