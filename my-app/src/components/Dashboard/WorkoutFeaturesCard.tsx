import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText 
} from '@mui/material';
import {
  DirectionsRun as WorkoutIcon,
  AccessTime as TimerIcon,
  AddBox as LogIcon,
  ShowChart as StatisticsIcon
} from '@mui/icons-material';

const WorkoutFeaturesCard: React.FC = React.memo(() => {
  const theme = useTheme();
  
  const features = [
    {
      icon: <WorkoutIcon sx={{ color: theme.palette.primary.main }} />,
      text: 'Start Workout',
      description: 'Begin a new workout session'
    },
    {
      icon: <TimerIcon sx={{ color: theme.palette.info.main }} />,
      text: 'Rest Timer',
      description: 'Time your rest between sets'
    },
    {
      icon: <LogIcon sx={{ color: theme.palette.success.main }} />,
      text: 'Log Exercise',
      description: 'Record your sets and reps'
    },
    {
      icon: <StatisticsIcon sx={{ color: theme.palette.warning.main }} />,
      text: 'Track Progress',
      description: 'Monitor your improvements'
    }
  ];
  
  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        p: 0,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        transition: theme.transitions.create(['box-shadow', 'transform'], {
          duration: theme.transitions.duration.short
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          p: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Workout Features
        </Typography>
      </Box>
      
      <List sx={{ width: '100%', p: 0 }}>
        {features.map((feature, index) => (
          <ListItem 
            key={index}
            sx={{
              borderBottom: index < features.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
              py: 0.75,
              px: 2
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {feature.icon}
            </ListItemIcon>
            <ListItemText 
              primary={feature.text}
              secondary={feature.description}
              primaryTypographyProps={{ 
                variant: 'body1',
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
              secondaryTypographyProps={{ 
                variant: 'body2',
                fontSize: '0.8rem'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
});

WorkoutFeaturesCard.displayName = 'WorkoutFeaturesCard';

export default WorkoutFeaturesCard;