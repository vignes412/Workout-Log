import React, { useMemo } from 'react';
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
import { getWidgetTitle } from './dashboardUtils';
import { useDashboard } from '../../context/DashboardContext';

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
      <CardHeader title={getWidgetTitle(id)} />
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

  // Check if a widget is visible based on the current layout visibility
  const isVisible = useMemo(() => (widgetId: string): boolean => {
    return layout.visibility[widgetId] || false;
  }, [layout.visibility]);

  // Get first log for workout summary
  const firstLogAsWorkout = useMemo(() => 
    logs.length > 0 
      ? logs[0] as unknown as TodaysWorkout
      : emptyWorkout, 
    [logs]);

  return (
    <>
      {/* Status Widget */}
      {isVisible('status') && (
        <WidgetWrapper id="status">
          <Box>
            {isOffline ? (
              <Typography color="error">Offline Mode</Typography>
            ) : (
              <Typography color="success.main">Online - Synced</Typography>
            )}
          </Box>
        </WidgetWrapper>
      )}

      {/* Ready to Train Widget */}
      {isVisible('train') && (
        <WidgetWrapper id="train">
          <Box>
            {readyToTrain && readyToTrain.length > 0 ? (
              <Typography>{readyToTrain.join(', ')}</Typography>
            ) : (
              <Typography color="text.secondary">No muscles ready to train</Typography>
            )}
          </Box>
        </WidgetWrapper>
      )}

      {/* Rest Widget */}
      {isVisible('rest') && (
        <WidgetWrapper id="rest">
          <Box>
            {restMuscles && restMuscles.length > 0 ? (
              <Typography>{restMuscles.join(', ')}</Typography>
            ) : (
              <Typography color="text.secondary">No muscles need rest</Typography>
            )}
          </Box>
        </WidgetWrapper>
      )}

      {/* Workout Logs Table */}
      {isVisible('workout-logs') && (
        <WidgetWrapper id="workout-logs">
          <WorkoutLogsTable 
            logs={logsAsLogEntries} 
            isOffline={isOffline} 
            exercises={exercises || []}
            setLogs={updateWorkoutLog}
          />
        </WidgetWrapper>
      )}

      {/* Muscle Group Distribution Chart */}
      {isVisible('muscle-distribution') && (
        <WidgetWrapper id="muscle-distribution">
          <MuscleGroupDistributionChart logs={logs} />
        </WidgetWrapper>
      )}

      {/* Workout Summary */}
      {isVisible('workout-summary') && (
        <WidgetWrapper id="workout-summary">
          <WorkoutSummary workout={firstLogAsWorkout} themeMode={themeMode} />
        </WidgetWrapper>
      )}

      {/* Workout Summary Table */}
      {isVisible('workout-summary-table') && (
        <WidgetWrapper id="workout-summary-table">
          <WorkoutSummaryTable logs={logsAsLogEntries} themeMode={themeMode} />
        </WidgetWrapper>
      )}

      {/* Progression by Muscle Chart */}
      {isVisible('progression-muscle') && (
        <WidgetWrapper id="progression-muscle">
          <ProgressionByMuscleChart logs={chartLogsFormat} />
        </WidgetWrapper>
      )}

      {/* Volume Over Time Chart */}
      {isVisible('volume-over-time') && (
        <WidgetWrapper id="volume-over-time">
          <VolumeOverTimeChart logs={logs} />
        </WidgetWrapper>
      )}

      {/* Fatigue by Muscle Chart */}
      {isVisible('fatigue-by-muscle') && (
        <WidgetWrapper id="fatigue-by-muscle">
          <FatigueByMuscleChart logs={chartLogsFormat} />
        </WidgetWrapper>
      )}

      {/* Progression & Fatigue Chart */}
      {isVisible('progression-fatigue') && (
        <WidgetWrapper id="progression-fatigue">
          <ProgressionFatigueChart logs={chartLogsFormat} />
        </WidgetWrapper>
      )}

      {/* Progress Goals */}
      {isVisible('progress-goals') && (
        <WidgetWrapper id="progress-goals">
          <ProgressGoals logs={logsAsLogEntries} />
        </WidgetWrapper>
      )}

      {/* Todo List */}
      {isVisible('todo-list') && (
        <WidgetWrapper id="todo-list">
          <TodoList />
        </WidgetWrapper>
      )}

      {/* Achievements Card */}
      {isVisible('achievements') && (
        <WidgetWrapper id="achievements">
          <AchievementsCard logs={logsAsLogEntries} />
        </WidgetWrapper>
      )}

      {/* Weekly Summary Card */}
      {isVisible('weekly-summary') && (
        <WidgetWrapper id="weekly-summary">
          <WeeklySummaryCard logs={logsAsLogEntries} />
        </WidgetWrapper>
      )}

      {/* Monthly Summary Card */}
      {isVisible('monthly-summary') && (
        <WidgetWrapper id="monthly-summary">
          <MonthlySummaryCard logs={logsAsLogEntries} />
        </WidgetWrapper>
      )}

      {/* Streak Tracker */}
      {isVisible('streak-tracker') && (
        <WidgetWrapper id="streak-tracker">
          <StreakTracker logs={logsAsLogEntries} />
        </WidgetWrapper>
      )}
    </>
  );
};

// Add display name for debugging
WidgetWrapper.displayName = 'WidgetWrapper';
DashboardWidgets.displayName = 'DashboardWidgets';

export default React.memo(DashboardWidgets);