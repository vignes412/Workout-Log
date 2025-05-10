import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  IconButton,
  LinearProgress,
  AppBar,
  Toolbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Paper
} from "@mui/material";
import { 
  FitnessCenter, 
  CheckCircle, 
  PlaylistAdd, 
  Done, 
  ArrowBack, 
  Save,
  Brightness4,
  Brightness7,
  Edit,
  Add
} from "@mui/icons-material";
import { initClient, fetchTodaysWorkout, updateTodaysWorkout, completeWorkout } from "../utils/sheetsApi";
import WorkoutLogModal from "./WorkoutLogModal";
import "../styles.css";

// Import WorkoutService for local storage operations
import WorkoutService from "../services/WorkoutService";

// Function to calculate overall workout progress
const calculateOverallProgress = (workout) => {
  if (!workout || !workout.workoutData || !workout.workoutData.exercises) return 0;
  
  const exercises = workout.workoutData.exercises;
  let totalSets = 0;
  let completedSets = 0;
  
  exercises.forEach(exercise => {
    totalSets += exercise.sets;
    completedSets += exercise.setsCompleted || 0;
  });
  
  return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
};

const TodaysWorkout = ({ accessToken, onNavigate, toggleTheme, themeMode }) => {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const [restStartTime, setRestStartTime] = useState(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTimerActive, setRestTimerActive] = useState(false);
  
  const [workoutLogModalOpen, setWorkoutLogModalOpen] = useState(false);
  const [logModalExercise, setLogModalExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  
  const [restTimeDialogOpen, setRestTimeDialogOpen] = useState(false);
  const [restTimeExercise, setRestTimeExercise] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(null);
  
  // Add new state for continue dialog
  const [continueDialogOpen, setContinueDialogOpen] = useState(false);
  const [nextExerciseData, setNextExerciseData] = useState(null);
  
  // Add the missing isFirstSet state
  const [isFirstSet, setIsFirstSet] = useState(true);
  
  const autoStartRestTimers = true;
  const defaultRestBetweenSets = 60;

  // Flag to prevent duplicate API calls
  const dataLoadedRef = useRef(false);

  // Function to save workout data to Google Sheets API
  const saveWorkoutDataToSheets = async (workoutData) => {
    try {
      console.log("Saving workout data to Google Sheets:", workoutData);
      
      if (!accessToken) {
        setSnackbar({
          open: true,
          message: "Authentication required to save data",
          severity: "error"
        });
        return false;
      }
      
      // Get the date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Format the workout data for the sheets API
      const rowData = exercises.flatMap(exercise => {
        return exercise.sets.map((set, setIndex) => {
          return [
            dateStr,                     // Date
            exercise.name,               // Exercise
            exercise.muscleGroup,        // Muscle Group
            setIndex + 1,                // Set Number
            set.weight || 0,             // Weight
            set.reps || 0,               // Reps
            set.completed ? "Yes" : "No" // Completed
          ];
        });
      });
      
      // Append data to the sheet
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/WorkoutLog:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rowData
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to save workout data");
      }
      
      setSnackbar({
        open: true,
        message: "Workout data saved successfully!",
        severity: "success"
      });
      
      return true;
    } catch (error) {
      console.error("Error saving workout data:", error);
      
      setSnackbar({
        open: true,
        message: `Error saving workout: ${error.message}`,
        severity: "error"
      });
      
      return false;
    }
  };

  // Function to scroll to a specific exercise
  const scrollToExercise = (exerciseIndex) => {
    const exerciseElement = document.getElementById(`exercise-${exerciseIndex}`);
    if (exerciseElement) {
      exerciseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Function to check if workout is complete
  const checkWorkoutCompletion = (workout) => {
    if (!workout || !workout.template || !workout.template.exercises) return false;
    
    // Check if all exercises have all sets completed
    const allExercisesComplete = workout.template.exercises.every(exercise => {
      if (exercise.setsCompleted === undefined || exercise.setsCompleted === null) return false;
      return exercise.setsCompleted >= exercise.sets;
    });
    
    return allExercisesComplete;
  };

  // Start the rest timer
  const startRestTimer = (duration = defaultRestBetweenSets, callback = null) => {
    setRestStartTime(Date.now());
    setRestTimerActive(true);
    
    // Store callback to execute when rest timer completes
    if (callback) {
      const timeoutId = setTimeout(() => {
        setRestTimerActive(false);
        setRestStartTime(null);
        callback();
      }, duration * 1000);
      
      // Return the timeout ID in case we need to clear it later
      return timeoutId;
    }
    
    setSnackbar({
      open: true,
      message: `Rest timer started for ${duration} seconds.`,
      severity: "info"
    });
  };

  // Stop the rest timer and calculate elapsed time
  // eslint-disable-next-line no-unused-vars
  const stopRestTimer = () => {
    if (!restStartTime) return;
    
    const elapsedSeconds = Math.round((Date.now() - restStartTime) / 1000);
    setRestSeconds(elapsedSeconds);
    setRestTimerActive(false);
    setRestStartTime(null);
    
    return elapsedSeconds;
  };

  // Load workout data - moved to the top and made into useCallback
  const loadWorkout = useCallback(async () => {
    if (dataLoadedRef.current) return;

    setLoading(true);
    try {
      await initClient(accessToken);
      const todaysWorkout = await fetchTodaysWorkout();
      
      if (todaysWorkout) {
        setWorkout(todaysWorkout);
        setNotes(todaysWorkout.notes || "");
        
        // Automatically start the rest timer when workout is first loaded
        if (!restTimerActive) {
          setRestStartTime(Date.now());
          setRestTimerActive(true);
        }
      }

      // Mark data as loaded
      dataLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading today's workout:", error);
      setSnackbar({
        open: true,
        message: "Failed to load today's workout",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, restTimerActive, setRestStartTime, setRestTimerActive, setSnackbar]);

  // Load today's workout when accessToken is available
  useEffect(() => {
    if (accessToken) {
      loadWorkout();
    }
  }, [accessToken, loadWorkout]);

  // Timer effect for real-time rest timer display
  useEffect(() => {
    let interval;
    if (restTimerActive) {
      // Update the UI every second to show elapsed time
      interval = setInterval(() => {
        // This will force a re-render to update the formatted time display
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimerActive]);

  // Load exercises for the WorkoutLogModal
  useEffect(() => {
    // We'll load the exercises data from the workout data itself
    if (workout && workout.workoutData && workout.workoutData.exercises) {
      // Create a list of unique exercises with their muscle groups
      const exerciseList = workout.workoutData.exercises.map(exercise => ({
        muscleGroup: exercise.muscleGroup || "",
        exercise: exercise.exercise
      }));
      setExercises(exerciseList);
    }
  }, [workout]);

  // Handle opening the workout log modal when a set is clicked
  const handleSetCompleted = (exerciseIndex, setIndex) => {
    if (!workout?.workoutData?.exercises) return;
    
    try {
      setCurrentExerciseIndex(exerciseIndex);
      
      const exercise = workout.workoutData.exercises[exerciseIndex];
      if (!exercise) return;
      
      // Format date and get rest time
      const formattedDate = new Date().toISOString().split('T')[0];
      const actualRestTime = restTimerActive && restStartTime
        ? Math.round((Date.now() - restStartTime) / 1000)
        : restSeconds;
      
      // Reset timer when opening modal
      if (restTimerActive) {
        setRestTimerActive(false);
        setRestStartTime(null);
      }
      
      // Prepare log data with minimal code
      const logData = {
        date: formattedDate,
        muscleGroup: exercise.muscleGroup || "",
        exercise: exercise.exercise,
        reps: exercise.reps?.toString() || "",
        weight: exercise.weight?.toString() || "0",
        rating: "5",
        restTime: actualRestTime?.toString() || "0",
        exerciseIndex,
        setIndex
      };
      
      setLogModalExercise(logData);
      setWorkoutLogModalOpen(true);
    } catch (error) {
      console.error("Error handling set completion:", error);
      setSnackbar({
        open: true,
        message: "Failed to log set completion",
        severity: "error"
      });
    }
  };

  const handleAddExtraSet = async (exerciseIndex) => {
    if (!workout || !workout.workoutData || !workout.workoutData.exercises) return;
    
    const updatedWorkout = { ...workout };
    const exercises = [...updatedWorkout.workoutData.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    
    // Add an extra set
    exercise.sets += 1;
    exercises[exerciseIndex] = exercise;
    updatedWorkout.workoutData.exercises = exercises;
    
    try {
      await updateTodaysWorkout(updatedWorkout.workoutData, false, notes);
      setWorkout(updatedWorkout);
      
      setSnackbar({
        open: true,
        message: "Extra set added! Click on the new set to log it.",
        severity: "success"
      });
      
      // Start rest timer for the extra set
      setRestStartTime(Date.now());
      setRestTimerActive(true);
      
    } catch (error) {
      console.error("Error adding extra set:", error);
      
      // Revert the change if there was an error
      exercise.sets -= 1;
      exercises[exerciseIndex] = exercise;
      updatedWorkout.workoutData.exercises = exercises;
      setWorkout(updatedWorkout);
      
      setSnackbar({
        open: true,
        message: "Failed to add extra set",
        severity: "error"
      });
    }
  };

  const handleOpenExerciseNotes = (exercise, index) => {
    setCurrentExercise({ ...exercise, index });
    setOpenDialog(true);
  };

  const handleSaveExerciseNotes = async () => {
    if (!currentExercise || !workout) return;
    
    const updatedWorkout = { ...workout };
    const exercises = [...updatedWorkout.workoutData.exercises];
    exercises[currentExercise.index] = { ...currentExercise };
    updatedWorkout.workoutData.exercises = exercises;
    
    try {
      await updateTodaysWorkout(updatedWorkout.workoutData, false, notes);
      setWorkout(updatedWorkout);
      setOpenDialog(false);
      
      setSnackbar({
        open: true,
        message: "Exercise notes saved successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error saving exercise notes:", error);
      setSnackbar({
        open: true,
        message: "Failed to save exercise notes",
        severity: "error"
      });
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;
    
    if (!window.confirm("Are you sure you want to finish this workout?")) {
      return;
    }
    
    setLoading(true);
    try {
      // Mark the workout as completed with notes
      await completeWorkout(notes);
      
      setSnackbar({
        open: true,
        message: "Workout completed successfully!",
        severity: "success"
      });
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        onNavigate("dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error completing workout:", error);
      setSnackbar({
        open: true,
        message: "Failed to complete workout",
        severity: "error"
      });
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!workout) return;
    
    try {
      await updateTodaysWorkout(workout.workoutData, false, notes);
      
      setSnackbar({
        open: true,
        message: "Workout notes saved successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error saving workout notes:", error);
      setSnackbar({
        open: true,
        message: "Failed to save workout notes",
        severity: "error"
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle opening the rest time dialog
  const handleOpenRestTimeDialog = (exercise, index) => {
    setRestTimeExercise({ ...exercise, index });
    setRestTimeDialogOpen(true);
  };

  // Handle closing the rest time dialog
  const handleCloseRestTimeDialog = () => {
    setRestTimeDialogOpen(false);
    setRestTimeExercise(null);
  };

  // Handle saving the rest time settings
  const handleSaveRestTime = async () => {
    if (!restTimeExercise || !workout) return;
    
    const updatedWorkout = { ...workout };
    const exercises = [...updatedWorkout.workoutData.exercises];
    exercises[restTimeExercise.index] = { ...restTimeExercise };
    updatedWorkout.workoutData.exercises = exercises;
    
    try {
      await updateTodaysWorkout(updatedWorkout.workoutData, false, notes);
      setWorkout(updatedWorkout);
      
      setSnackbar({
        open: true,
        message: "Rest time updated successfully",
        severity: "success"
      });
      
      handleCloseRestTimeDialog();
    } catch (error) {
      console.error("Error saving rest time:", error);
      setSnackbar({
        open: true,
        message: "Failed to save rest time",
        severity: "error"
      });
    }
  };

  const handleWorkoutLogModalClose = () => {
    setWorkoutLogModalOpen(false);
    setLogModalExercise(null);
  };

  // Handle updates after a workout log is submitted
  const handleWorkoutLogSubmitted = async (exerciseIndex, setIndex = null) => {
    if (exerciseIndex === undefined || exerciseIndex === null) {
      console.error("No exercise index provided to handleWorkoutLogSubmitted");
      return;
    }

    try {
      // Get the current workout state
      const currentWorkout = { ...workout };
      
      if (!currentWorkout?.workoutData?.exercises) {
        setSnackbar({
          open: true,
          message: "Error: Invalid workout data structure",
          severity: "error"
        });
        return;
      }
      
      if (exerciseIndex < 0 || exerciseIndex >= currentWorkout.workoutData.exercises.length) {
        setSnackbar({
          open: true,
          message: "Error: Invalid exercise index",
          severity: "error"
        });
        return;
      }
      
      // Get the specific exercise that was logged
      const exercise = currentWorkout.workoutData.exercises[exerciseIndex];
      
      // Initialize setsCompleted as a number if it doesn't exist
      if (exercise.setsCompleted === undefined || exercise.setsCompleted === null) {
        exercise.setsCompleted = 0;
      }
      
      // Increment the completed sets counter
      if (exercise.setsCompleted < exercise.sets) {
        exercise.setsCompleted += 1;
      }
      
      // Calculate progress for this exercise
      const completedSetsCount = exercise.setsCompleted;
      exercise.percentComplete = (completedSetsCount / exercise.sets) * 100;
      
      // Update the exercise in the workout
      currentWorkout.workoutData.exercises[exerciseIndex] = exercise;
      setCurrentExerciseIndex(exerciseIndex);
      setWorkout(currentWorkout);
      
      // Handle rest timer for completed sets
      const allSetsComplete = completedSetsCount >= exercise.sets;
      const isLastExercise = exerciseIndex === currentWorkout.workoutData.exercises.length - 1;
      
      // Get next exercise or set
      const nextData = getNextExerciseOrSet(exerciseIndex, exercise);
      
      // Show continue dialog instead of automatically continuing
      setNextExerciseData(nextData);
      setContinueDialogOpen(true);
      
      // Save to Google Sheets API
      await updateTodaysWorkout(currentWorkout.workoutData, false, notes);
      
      // Also save to local storage for offline support
      await WorkoutService.updateTodaysWorkout(currentWorkout);
      
      // Check workout completion
      checkWorkoutCompletion(currentWorkout);
    } catch (error) {
      console.error("Error updating workout progress:", error);
      setSnackbar({
        open: true,
        message: "Failed to update workout progress",
        severity: "error"
      });
    }
  };

  // Add a helper function to determine the next exercise or set
  const getNextExerciseOrSet = (currentExerciseIndex, currentExercise) => {
    if (!workout || !workout.workoutData || !workout.workoutData.exercises) {
      return null;
    }
    
    // Check if there are more sets in the current exercise
    if (currentExercise.setsCompleted < currentExercise.sets) {
      return {
        type: 'set',
        exerciseIndex: currentExerciseIndex,
        exercise: currentExercise,
        setIndex: currentExercise.setsCompleted
      };
    } 
    
    // If all sets for current exercise are done, move to next exercise
    const nextExerciseIndex = currentExerciseIndex + 1;
    if (nextExerciseIndex < workout.workoutData.exercises.length) {
      return {
        type: 'exercise',
        exerciseIndex: nextExerciseIndex,
        exercise: workout.workoutData.exercises[nextExerciseIndex],
        setIndex: 0
      };
    }
    
    // If all exercises are done
    return {
      type: 'complete',
      exerciseIndex: null,
      exercise: null,
      setIndex: null
    };
  };

  // Handle the user's choice from the continue dialog
  const handleContinueResponse = (shouldContinue) => {
    setContinueDialogOpen(false);
    
    if (shouldContinue && nextExerciseData) {
      // If it's a new set of the same exercise or a new exercise
      if (nextExerciseData.type === 'set' || nextExerciseData.type === 'exercise') {
        setCurrentExerciseIndex(nextExerciseData.exerciseIndex);
        
        // Start rest timer if auto-start is enabled
        if (autoStartRestTimers && nextExerciseData.exercise) {
          setRestTimeExercise(nextExerciseData.exercise);
          setRestTimeDialogOpen(true);
        }
      } else if (nextExerciseData.type === 'complete') {
        // Workout is complete
        const updatedWorkout = { ...workout, completed: true };
        setWorkout(updatedWorkout);
        saveWorkoutDataToSheets(updatedWorkout);
        setSnackbar({
          open: true,
          message: "Workout completed! Great job!",
          severity: "success"
        });
      }
    }
    
    // Clear the next exercise data
    setNextExerciseData(null);
  };

  return (
    <div className="todays-workout-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Today's Workout
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => onNavigate("dashboard")}
            startIcon={<ArrowBack />}
          >
            Back to Dashboard
          </Button>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <div className="todays-workout-content" style={{ padding: "20px" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !workout ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Typography variant="h5" gutterBottom>
              No workout planned for today
            </Typography>
            <Typography variant="body1" paragraph>
              You haven't set up a workout for today yet.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => onNavigate("workoutTemplates")}
              startIcon={<PlaylistAdd />}
            >
              Choose a Workout Template
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" gutterBottom>
                {workout.workoutData.templateName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mr: 1 }}>
                  Started: {new Date(workout.workoutData.startTime).toLocaleTimeString()}
                </Typography>
                
                <Box sx={{ flexGrow: 1 }} />
                
                {/* Rest timer indicator */}
                {restTimerActive ? (
                  <Chip 
                    label={`Rest Time: ${formatTime(Math.round((Date.now() - restStartTime) / 1000))}`} 
                    color="primary" 
                    variant="filled"
                    sx={{ mr: 2 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                    Rest timer will start automatically after saving a set
                  </Typography>
                )}
                
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={handleCompleteWorkout}
                  disabled={loading}
                >
                  Finish Workout
                </Button>
              </Box>
              
              {/* Overall progress */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Overall Progress
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {calculateOverallProgress(workout)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateOverallProgress(workout)} 
                  sx={{ height: 8, borderRadius: 4 }} 
                />
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              {/* Exercise Cards */}
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  Exercises
                </Typography>
                
                {workout.workoutData.exercises.map((exercise, exerciseIndex) => (
                  <Card key={exerciseIndex} sx={{ mb: 2 }} id={`exercise-${exerciseIndex}`}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FitnessCenter sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          {exercise.exercise || "Unnamed Exercise"}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Chip 
                          label={`${exercise.setsCompleted || 0}/${exercise.sets} sets`} 
                          color={(exercise.setsCompleted || 0) >= exercise.sets ? "success" : "primary"} 
                          variant={(exercise.setsCompleted || 0) >= exercise.sets ? "filled" : "outlined"}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {exercise.sets} sets x {exercise.reps} reps {exercise.weight ? `@ ${exercise.weight}` : ''}
                      </Typography>
                      
                      {/* Progress bar */}
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(exercise.setsCompleted / exercise.sets) * 100 || 0} 
                          sx={{ height: 8, borderRadius: 4 }} 
                        />
                      </Box>
                      
                      {/* Set buttons */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                          <Button
                            key={setIndex}
                            variant={exercise.setsCompleted > setIndex ? "contained" : "outlined"}
                            color={exercise.setsCompleted > setIndex ? "success" : "primary"}
                            size="small"
                            onClick={() => handleSetCompleted(exerciseIndex, setIndex)}
                            sx={{ minWidth: '60px' }}
                            disabled={exercise.setsCompleted > setIndex}
                          >
                            {exercise.setsCompleted > setIndex ? (
                              <Done fontSize="small" />
                            ) : (
                              `Set ${setIndex + 1}`
                            )}
                          </Button>
                        ))}
                        
                        {/* Extra set button - only show if all planned sets are completed */}
                        {exercise.setsCompleted >= exercise.sets && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={() => handleAddExtraSet(exerciseIndex)}
                            sx={{ minWidth: '60px' }}
                            startIcon={<Add fontSize="small" />}
                          >
                            Extra Set
                          </Button>
                        )}
                      </Box>
                      
                      {/* Notes section */}
                      {exercise.notes && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Notes: {exercise.notes}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<Edit />}
                        onClick={() => handleOpenExerciseNotes(exercise, exerciseIndex)}
                      >
                        Add Notes
                      </Button>
                      <Button 
                        size="small"
                        onClick={() => handleOpenRestTimeDialog(exercise, exerciseIndex)}
                        color="secondary"
                      >
                        Set Rest Time {exercise.restTime ? `(${exercise.restTime}s)` : ''}
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Grid>
              
              {/* Notes Section */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Workout Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your workout here..."
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<Save />}
                    onClick={handleSaveNotes}
                    fullWidth
                  >
                    Save Notes
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Exercise Notes Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Exercise Notes: {currentExercise?.name}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={currentExercise?.notes || ""}
              onChange={(e) => setCurrentExercise({...currentExercise, notes: e.target.value})}
              placeholder="Add notes about this exercise (e.g., how it felt, modifications made, etc.)"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveExerciseNotes} 
              color="primary" 
              variant="contained"
              startIcon={<Save />}
            >
              Save Notes
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* WorkoutLogModal for logging completed sets */}
        <WorkoutLogModal
          open={workoutLogModalOpen}
          onClose={() => {
            // When modal is manually closed, don't mark the set as completed
            handleWorkoutLogModalClose();
          }}
          exercises={exercises}
          isOffline={false}
          editLog={logModalExercise}
          onSave={async (row, originalIndex, exerciseIndex, setIndex) => {
            try {
              // First determine which exercise index to use
              let actualExerciseIndex;
              let actualSetIndex;
              
              // Priority 1: Use the exerciseIndex parameter if provided
              if (exerciseIndex !== undefined && exerciseIndex !== null) {
                actualExerciseIndex = exerciseIndex;
              } 
              // Priority 2: Use the exerciseIndex from logModalExercise
              else if (logModalExercise && typeof logModalExercise.exerciseIndex === 'number') {
                actualExerciseIndex = logModalExercise.exerciseIndex;
              } 
              // Priority 3: Use the currentExerciseIndex from component state
              else if (currentExerciseIndex !== null) {
                actualExerciseIndex = currentExerciseIndex;
              } else {
                console.error("Could not determine exercise index for workout log");
                return;
              }
              
              // Similarly, determine which set index to use
              if (setIndex !== undefined && setIndex !== null) {
                actualSetIndex = setIndex;
              }
              else if (logModalExercise && typeof logModalExercise.setIndex === 'number') {
                actualSetIndex = logModalExercise.setIndex;
              }
              
              // Call the handler with both indices
              await handleWorkoutLogSubmitted(actualExerciseIndex, actualSetIndex);
              
              // Start first set flag to false as we've now completed a set
              setIsFirstSet(false);
              
              // Start the rest timer automatically if configured to do so
              startRestTimer();
              
              // Close the modal
              handleWorkoutLogModalClose();
            } catch (error) {
              console.error("Error handling workout log submission:", error);
              setSnackbar({
                open: true, 
                message: "Error saving workout data", 
                severity: "error"
              });
            }
          }}
        />
        
        {/* Rest Time Dialog */}
        <Dialog open={restTimeDialogOpen} onClose={handleCloseRestTimeDialog}>
          <DialogTitle>
            Set Rest Time: {restTimeExercise?.name}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set the rest time between sets for this exercise. Default is 90 seconds.
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Rest Time (seconds)"
              value={restTimeExercise?.restTime || "90"}
              onChange={(e) => setRestTimeExercise({...restTimeExercise, restTime: e.target.value})}
              InputProps={{ inputProps: { min: 0, max: 300 } }}
              variant="outlined"
              sx={{ mt: 1 }}
              helperText="Rest time in seconds (0-300)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRestTimeDialog}>Cancel</Button>
            <Button 
              onClick={handleSaveRestTime} 
              color="primary" 
              variant="contained"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Continue Dialog */}
        <Dialog open={continueDialogOpen} onClose={() => handleContinueResponse(false)}>
          <DialogTitle>Continue to iterate?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {nextExerciseData?.type === 'set' && `Continue to Set ${nextExerciseData.setIndex + 1} of ${nextExerciseData.exercise.exercise}?`}
              {nextExerciseData?.type === 'exercise' && `Continue to Exercise: ${nextExerciseData.exercise.exercise}?`}
              {nextExerciseData?.type === 'complete' && "Workout is complete! Great job!"}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleContinueResponse(false)}>Cancel</Button>
            <Button onClick={() => handleContinueResponse(true)} color="primary" variant="contained">
              Continue
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={() => setSnackbar({...snackbar, open: false})}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({...snackbar, open: false})} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default TodaysWorkout;