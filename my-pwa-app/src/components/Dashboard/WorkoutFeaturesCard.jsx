import React from "react";
import { Button, Box, Typography, Stack, Card, CardContent } from "@mui/material";
import { Today as TodaysWorkoutIcon, ListAlt as TemplatesIcon, Add } from "@mui/icons-material";
import { useAppState } from "../../index";

const WorkoutFeaturesCard = () => {
  const { dispatch } = useAppState();

  const handleNavigate = (page) => {
    dispatch({ type: "SET_PAGE", payload: page });
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: 2,
      boxShadow: 'none'
    }}>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Workout Features
        </Typography>
        <Stack spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            startIcon={<TodaysWorkoutIcon />}
            onClick={() => handleNavigate("todaysWorkout")}
          >
            Today's Workout
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            fullWidth
            startIcon={<TemplatesIcon />}
            onClick={() => handleNavigate("workoutTemplates")}
          >
            Workout Templates
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            fullWidth
            startIcon={<Add />}
            onClick={() => handleNavigate("workoutTemplates")}
          >
            Create New Template
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WorkoutFeaturesCard;