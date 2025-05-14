import React, { useMemo, Fragment } from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import MonthlySummaryCard from '../MonthlySummaryCard';
import WeeklySummaryCard from '../WeeklySummaryCard';
import StreakTracker from '../StreakTracker';
import ProgressGoals from '../ProgressGoals';
import TodoList from '../TodoList';
import MuscleGroupDistributionChart from '../charts/MuscleGroupDistributionChart';
import VolumeOverTimeChart from '../charts/VolumeOverTimeChart';
import ProgressionByMuscleChart from '../charts/ProgressionByMuscleChart';
import FatigueByMuscleChart from '../charts/FatigueByMuscleChart';
import AchievementsCard from '../AchievementsCard';
import WorkoutSummary from '../WorkoutSummary';
import WorkoutSummaryTable from '../WorkoutSummaryTable';
import ProgressionFatigueChart from '../charts/ProgressionFatigueChart';
import WorkoutLogsTable from '../WorkoutLogsTable';
import { TodaysWorkout } from '../../types';
import { getWidgetTitle, DashboardWidgetId } from './dashboardUtils';
import { useDashboard } from '../../context/DashboardContext';
import { StatusCard, TrainMusclesCard, RestMusclesCard } from './StatusCards';
import WorkoutFeaturesCard from './WorkoutFeaturesCard';
import { HighlightMetricCard } from './DashboardCards';

// Helper component for creating card headers with Material UI styling
const CardHeader = ({ title }: { title: string }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        height: {xs: 36, sm: 40, md: 48},
        userSelect: 'none',
        position: 'relative',
        zIndex: 2
      }}
    >
      <Typography variant="subtitle1" fontWeight="medium" noWrap sx={{ flex: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex' }}>
        {/* We can add actions like dropdown menu here in the future */}
      </Box>
    </Box>
  );
};

// Widget wrapper using Material UI styling
const WidgetWrapper = React.memo(({ id, children }: { id: string, children: React.ReactNode }) => {
  const { isCustomizing } = useDashboard();
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={isCustomizing ? 3 : 1}
      className={`widget-paper ${id}-widget`}
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        position: 'relative',
        boxSizing: 'border-box',
        maxWidth: '100%',
        transition: theme => theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme => theme.shadows[isCustomizing ? 6 : 3],
        }
      }}
    >
      <CardHeader title={getWidgetTitle(id as DashboardWidgetId)} />
      <Box 
        sx={{
          flex: '1 1 auto',
          p: 2,
          overflowY: 'auto',
          height: 'calc(100% - 48px)',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Paper>
  );
});

// Create empty workout for when there are no logs
const emptyWorkout = {
  date: new Date().toISOString(),
  workoutData: {
    templateName: 'No Workout Data',
    startTime: new Date().toISOString(),
    exercises: []
  },
  completed: false
} as TodaysWorkout & { notes?: string, endTime?: string, workoutData?: any };

const DashboardWidgets: React.FC = () => {
  const {
    layout,
    logs,
    isOffline,
    readyToTrain,
    restMuscles,
    logsAsLogEntries,
    chartLogsFormat,
    themeMode,
    exercises,
    updateWorkoutLog
  } = useDashboard();

  // Get first log for workout summary
  const firstLogAsWorkout = useMemo(() => 
    logs.length > 0 
      ? logs[0] as unknown as TodaysWorkout
      : emptyWorkout, 
    [logs]);

  // Calculate workout stats for the metric cards
  const totalWorkouts = useMemo(() => logs.length || 0, [logs]);
  const totalVolume = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    
    return logs.reduce((sum, log) => {
      const weight = typeof log.weight === 'number' ? log.weight : 0;
      const reps = typeof log.reps === 'number' ? log.reps : 0;
      return sum + (weight * reps);
    }, 0);
  }, [logs]);

  // Calculate workout streak
  const workoutStreak = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    
    // This is a simplified calculation; a more complex one would check for consecutive days
    return Math.min(logs.length, 7);
  }, [logs]);

  // Render all widgets as separate individual components
  return (
    <Fragment>
      {/* Only render widgets that are visible according to layout.visibility */}
      {layout.visibility.status && (
        <WidgetWrapper id="status">
          <StatusCard isOffline={isOffline} />
        </WidgetWrapper>
      )}

      {layout.visibility.train && (
        <WidgetWrapper id="train">
          <TrainMusclesCard items={readyToTrain || []} />
        </WidgetWrapper>
      )}

      {layout.visibility.rest && (
        <WidgetWrapper id="rest">
          <RestMusclesCard items={restMuscles || []} />
        </WidgetWrapper>
      )}
      
      {layout.visibility["workout-features"] && (
        <WidgetWrapper id="workout-features">
          <WorkoutFeaturesCard />
        </WidgetWrapper>
      )}
      
      {layout.visibility["workout-count"] && (
        <WidgetWrapper id="workout-count">
          <HighlightMetricCard 
            value={totalWorkouts}
            label="Total Workouts"
          />
        </WidgetWrapper>
      )}
      
      {layout.visibility["total-volume"] && (
        <WidgetWrapper id="total-volume">
          <HighlightMetricCard 
            value={totalVolume.toLocaleString()}
            label="Total Volume (lbs)"
          />
        </WidgetWrapper>
      )}

      {layout.visibility["workout-logs"] && (
        <WidgetWrapper id="workout-logs">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <WorkoutLogsTable 
              logs={logsAsLogEntries} 
              isOffline={isOffline} 
              exercises={exercises || []}
              setLogs={updateWorkoutLog}
            />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["muscle-distribution"] && (
        <WidgetWrapper id="muscle-distribution">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MuscleGroupDistributionChart logs={logs} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["workout-summary"] && (
        <WidgetWrapper id="workout-summary">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <WorkoutSummary workout={firstLogAsWorkout} themeMode={themeMode} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["workout-summary-table"] && (
        <WidgetWrapper id="workout-summary-table">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <WorkoutSummaryTable logs={logsAsLogEntries} themeMode={themeMode} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["progression-muscle"] && (
        <WidgetWrapper id="progression-muscle">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ProgressionByMuscleChart logs={chartLogsFormat} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["volume-over-time"] && (
        <WidgetWrapper id="volume-over-time">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <VolumeOverTimeChart logs={logs} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["fatigue-by-muscle"] && (
        <WidgetWrapper id="fatigue-by-muscle">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <FatigueByMuscleChart logs={chartLogsFormat} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["progression-fatigue"] && (
        <WidgetWrapper id="progression-fatigue">
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ProgressionFatigueChart logs={chartLogsFormat} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["progress-goals"] && (
        <WidgetWrapper id="progress-goals">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <ProgressGoals logs={logsAsLogEntries} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["todo-list"] && (
        <WidgetWrapper id="todo-list">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <TodoList />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility.achievements && (
        <WidgetWrapper id="achievements">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <AchievementsCard logs={logsAsLogEntries} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["weekly-summary"] && (
        <WidgetWrapper id="weekly-summary">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <WeeklySummaryCard logs={logsAsLogEntries} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["monthly-summary"] && (
        <WidgetWrapper id="monthly-summary">
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
            <MonthlySummaryCard logs={logsAsLogEntries} />
          </Box>
        </WidgetWrapper>
      )}

      {layout.visibility["streak-tracker"] && (
        <WidgetWrapper id="streak-tracker">
          <Box sx={{ width: '100%', height: '100%' }}>
            <HighlightMetricCard 
              value={workoutStreak}
              label="Current Streak (days)"
            />
          </Box>
        </WidgetWrapper>
      )}
    </Fragment>
  );
};

// Add display name for debugging
WidgetWrapper.displayName = 'WidgetWrapper';
DashboardWidgets.displayName = 'DashboardWidgets';

export default React.memo(DashboardWidgets);