import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, ArrowBack, Refresh } from '@mui/icons-material';
import { useWorkoutTemplates, useExerciseLibrary } from '../hooks/dataHooks';
import DataService from '../services/DataService';
import { WorkoutTemplate } from '../types';

interface WorkoutTemplatesProps {
  accessToken: string;
  onNavigate: (page: string) => void;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark';
}

const WorkoutTemplates: React.FC<WorkoutTemplatesProps> = ({ accessToken, onNavigate, toggleTheme, themeMode }) => {
  // Use our custom hooks for data fetching with caching
  const { 
    data: templates, 
    isLoading: templatesLoading, 
    refreshData: refreshTemplates, 
    error: templatesError 
  } = useWorkoutTemplates();
  
  const { 
    data: exerciseLibrary, 
    isLoading: exercisesLoading 
  } = useExerciseLibrary();
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: "",
    severity: "info"
  });
  
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  // Update offline status
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
  
  // Extract unique muscle groups and exercises when exerciseLibrary changes
  useEffect(() => {
    if (exerciseLibrary && exerciseLibrary.length > 0) {
      // Extract unique muscle groups
      const uniqueMuscleGroups = [...new Set(exerciseLibrary.map(ex => ex.muscleGroup))].sort();
      setMuscleGroups(uniqueMuscleGroups);
      
      // Set initial exercise options to all exercises
      setExerciseOptions(exerciseLibrary.map(ex => ex.exercise));
    }
  }, [exerciseLibrary]);
  
  // Initialize DataService once on component mount
  useEffect(() => {
    if (accessToken) {
      DataService.initialize(accessToken).catch(console.error);
    }
  }, [accessToken]);
  
  const handleCreateTemplate = useCallback(() => {
    onNavigate("workoutTemplateBuilder");
  }, [onNavigate]);
  
  const handleEditTemplate = useCallback((template: WorkoutTemplate) => {
    localStorage.setItem('editTemplateId', template.id.toString());
    localStorage.setItem('editTemplate', JSON.stringify(template));
    onNavigate("workoutTemplateBuilder");
  }, [onNavigate]);
  
  const handleDeleteTemplate = useCallback(async (template: WorkoutTemplate) => {
    if (!window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }
    
    setLoading(true);
    try {
      await DataService.deleteWorkoutTemplate(template.rowIndex || template.id);
      await refreshTemplates();
      
      setSnackbar({
        open: true,
        message: "Template deleted successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete template",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [refreshTemplates]);
  
  const handleStartWorkout = useCallback((template: WorkoutTemplate) => {
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    onNavigate("todaysworkout");
  }, [onNavigate]);
  
  const handleBack = useCallback(() => {
    onNavigate("dashboard");
  }, [onNavigate]);
  
  // Handle errors gracefully
  if (templatesError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error loading workout templates
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Refresh />}
          onClick={() => refreshTemplates()} 
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
        <Button 
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mt: 2, ml: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }
  
  // Show loading state
  if (templatesLoading || exercisesLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBack} 
            sx={{ mr: 1 }}
            aria-label="Back to dashboard"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" component="h1">
            Workout Templates
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleCreateTemplate}
          disabled={loading || isOffline}
        >
          Create New Template
        </Button>
      </Box>
      
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are currently offline. Some features may be limited.
        </Alert>
      )}
      
      {templates && templates.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          p: 4, 
          border: '1px dashed', 
          borderColor: 'divider',
          borderRadius: 2
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No workout templates yet
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Create your first workout template to get started!
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleCreateTemplate}
            disabled={loading || isOffline}
          >
            Create New Template
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {templates && templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  "&:hover": {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                  </Typography>
                  <Box sx={{ my: 1 }}>
                    {template.exercises.length > 0 ? (
                      <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                        {template.exercises.slice(0, 3).map((exercise, index) => (
                          <li key={index}>
                            <Typography variant="body2" noWrap>
                              {exercise.name} - {exercise.targetSets}x{exercise.targetReps}
                            </Typography>
                          </li>
                        ))}
                        {template.exercises.length > 3 && (
                          <Typography variant="body2" color="text.secondary">
                            +{template.exercises.length - 3} more
                          </Typography>
                        )}
                      </ul>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No exercises added yet
                      </Typography>
                    )}
                  </Box>
                  {template.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Notes: {template.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleEditTemplate(template)}
                      disabled={loading || isOffline}
                      aria-label="Edit template"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteTemplate(template)}
                      disabled={loading || isOffline}
                      aria-label="Delete template"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  <Button 
                    variant="contained" 
                    size="small" 
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartWorkout(template)}
                    disabled={loading || template.exercises.length === 0}
                    aria-label="Start workout"
                  >
                    Start
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkoutTemplates;