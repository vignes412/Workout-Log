import React, { useCallback } from "react";
import { Button, Typography, Stack, Paper, Box, useTheme, alpha } from "@mui/material";
import { Today as TodaysWorkoutIcon, ListAlt as TemplatesIcon, Add, FitnessCenter } from "@mui/icons-material";
import { useAppState } from "../../index";

interface WorkoutFeaturesCardProps {
  // Add props if needed in the future
}

const WorkoutFeaturesCard: React.FC<WorkoutFeaturesCardProps> = React.memo(() => {
  const { dispatch } = useAppState();
  const theme = useTheme();

  const handleNavigate = useCallback((page: string): void => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, [dispatch]);

  return (
    <Paper 
      elevation={1}
      sx={{ 
        height: '100%', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        p: 0,
        overflow: 'hidden',
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
        <FitnessCenter sx={{ mr: 1, color: theme.palette.primary.main }} />
        <Typography variant="subtitle1" fontWeight="medium">
          Workout Features
        </Typography>
      </Box>
      
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Stack spacing={1.5}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            startIcon={<TodaysWorkoutIcon />}
            onClick={() => handleNavigate("todaysWorkout")}
            size="large"
            sx={{ 
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            Today's Workout
          </Button>
          
          <Button 
            variant="outlined" 
            color="primary" 
            fullWidth
            startIcon={<TemplatesIcon />}
            onClick={() => handleNavigate("workoutTemplates")}
            size="large"
            sx={{ 
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            Workout Templates
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth
            startIcon={<Add />}
            onClick={() => handleNavigate("workoutTemplates")}
            size="large"
            sx={{ 
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              bgcolor: alpha(theme.palette.secondary.main, 0.1)
            }}
          >
            Create New Template
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
});

WorkoutFeaturesCard.displayName = 'WorkoutFeaturesCard';

export default WorkoutFeaturesCard;