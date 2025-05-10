import React from 'react';
import { Paper, Box, Typography, useTheme, SxProps, Theme } from '@mui/material';

// Common interface for all widget components
export interface WidgetProps {
  id: string;
  title?: string;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

// Base widget component that all other widgets will inherit from
export const BaseWidget: React.FC<WidgetProps> = ({ 
  id, 
  title, 
  children,
  sx = {}
}) => {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={1}
      sx={{
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        ...sx
      }}
      data-widget-id={id}
    >
      {title && (
        <Box
          sx={{
            p: 2,
            pl: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.02)'
          }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }}}>
            {title}
          </Typography>
        </Box>
      )}
      <Box
        sx={{ 
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

// Status Widget
export const StatusWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Status">
      <Typography>Status information goes here</Typography>
    </BaseWidget>
  );
};

// Train Widget
export const TrainWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Ready to Train">
      <Typography>Train information goes here</Typography>
    </BaseWidget>
  );
};

// Rest Widget
export const RestWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Rest">
      <Typography>Rest information goes here</Typography>
    </BaseWidget>
  );
};

// Workout Features Widget
export const WorkoutFeaturesWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Workout Features">
      <Typography>Workout features go here</Typography>
    </BaseWidget>
  );
};

// Workout Logs Widget
export const WorkoutLogsWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Recent Workout Logs">
      <Typography>Workout logs go here</Typography>
    </BaseWidget>
  );
};

// Muscle Distribution Widget
export const MuscleDistributionWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Muscle Group Distribution">
      <Typography>Muscle distribution chart goes here</Typography>
    </BaseWidget>
  );
};

// Workout Count Widget
export const WorkoutCountWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Workout Count">
      <Typography>Workout count goes here</Typography>
    </BaseWidget>
  );
};

// Total Volume Widget
export const TotalVolumeWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Total Volume">
      <Typography>Total volume goes here</Typography>
    </BaseWidget>
  );
};

// Todo List Widget
export const TodoListWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Todo List">
      <Typography>Todo list goes here</Typography>
    </BaseWidget>
  );
};

// Workout Summary Widget
export const WorkoutSummaryWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Workout Summary">
      <Typography>Workout summary goes here</Typography>
    </BaseWidget>
  );
};

// Workout Summary Table Widget
export const WorkoutSummaryTableWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Workout Summary Table">
      <Typography>Workout summary table goes here</Typography>
    </BaseWidget>
  );
};

// Progression Fatigue Widget
export const ProgressionFatigueWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Progression & Fatigue">
      <Typography>Progression and fatigue data goes here</Typography>
    </BaseWidget>
  );
};

// Progression By Muscle Widget
export const ProgressionByMuscleWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Progression by Muscle">
      <Typography>Progression by muscle data goes here</Typography>
    </BaseWidget>
  );
};

// Volume Over Time Widget
export const VolumeOverTimeWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Volume Over Time">
      <Typography>Volume over time chart goes here</Typography>
    </BaseWidget>
  );
};

// Fatigue By Muscle Widget
export const FatigueByMuscleWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Fatigue by Muscle">
      <Typography>Fatigue by muscle data goes here</Typography>
    </BaseWidget>
  );
};

// Progress Goals Widget
export const ProgressGoalsWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Progress Goals">
      <Typography>Progress goals go here</Typography>
    </BaseWidget>
  );
};

// Achievements Widget
export const AchievementsWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Achievements">
      <Typography>Achievements go here</Typography>
    </BaseWidget>
  );
};

// Weekly Summary Widget
export const WeeklySummaryWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Weekly Summary">
      <Typography>Weekly summary goes here</Typography>
    </BaseWidget>
  );
};

// Monthly Summary Widget
export const MonthlySummaryWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Monthly Summary">
      <Typography>Monthly summary goes here</Typography>
    </BaseWidget>
  );
};

// Streak Tracker Widget
export const StreakTrackerWidget: React.FC<WidgetProps> = (props) => {
  return (
    <BaseWidget {...props} title="Streak Tracker">
      <Typography>Streak tracker goes here</Typography>
    </BaseWidget>
  );
};