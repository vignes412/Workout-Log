import React, { useState, useEffect, useRef } from "react";
import { initClient, syncData, saveWorkoutTemplate } from "../utils/sheetsApi";
import {
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Grid,
  AppBar,
  Toolbar,
  Autocomplete,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Add,
  Remove,
  Delete,
  Save,
  Edit,
} from "@mui/icons-material";
import "../styles.css";

const WorkoutTemplateBuilder = ({
  accessToken,
  onNavigate,
  toggleTheme,
  themeMode,
}) => {
  // State for exercises to choose from
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState(null);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [muscleGroups, setMuscleGroups] = useState([]);

  // State for the workout template
  const [templateName, setTemplateName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Refs to store temporary input values
  const muscleGroupRef = useRef(null);
  const exerciseSearchRef = useRef(null);

  // Function to load exercises
  const loadExercises = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      await initClient(accessToken);
      await syncData(
        "Exercises!A2:P",
        "/api/exercises",
        setExercises,
        (row) => ({
          muscleGroup: row[0],
          exercise: row[1],
          difficultyLevel: row[3],
          equipmentRequired: row[4],
          targetIntensity: row[5],
          primaryMuscleGroup: row[6],
          secondaryMuscleGroup: row[7],
          exerciseDuration: row[8],
          recoveryTime: row[9],
          exerciseType: row[10],
          caloriesBurned: row[11],
          exerciseProgression: row[12],
          injuryRiskLevel: row[13],
          exerciseLink: row[2],
          imageLink: row[14],
          relativePath: row[15],
        })
      );
    } catch (error) {
      console.error("Error loading exercises:", error);
      showToast("Failed to load exercises", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to load muscle groups
  const loadMuscleGroups = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      await initClient(accessToken);
      await syncData(
        "Exercises!A2:A",
        "/api/muscleGroups",
        (data) => {
          const uniqueMuscleGroups = [
            ...new Set(data.map((row) => row[0])),
          ].sort();
          setMuscleGroups(uniqueMuscleGroups);
        }
      );
    } catch (error) {
      console.error("Error loading muscle groups:", error);
      showToast("Failed to load muscle groups", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load muscle groups on component mount
  useEffect(() => {
    loadMuscleGroups();
  }, [accessToken]);

  // Handle search button click
  const handleSearch = () => {
    setMuscleGroupFilter(muscleGroupRef.current?.value || null);
    setExerciseFilter(exerciseSearchRef.current?.value || "");
    loadExercises();
  };

  // Filter exercises based on search criteria
  const filteredExercises = exercises.filter((exercise) => {
    const matchesMuscleGroup =
      !muscleGroupFilter ||
      exercise.muscleGroup?.toLowerCase() === muscleGroupFilter.toLowerCase();
    const matchesExercise =
      !exerciseFilter ||
      exercise.exercise?.toLowerCase().includes(exerciseFilter.toLowerCase());
    return matchesMuscleGroup && matchesExercise;
  });

  // Add exercise to template
  const addExerciseToTemplate = (exercise) => {
    // Check if exercise already exists in template
    const existingIndex = selectedExercises.findIndex(
      (item) => item.exercise === exercise.exercise
    );

    if (existingIndex >= 0) {
      showToast("Exercise already added to template", "warning");
      return;
    }

    setSelectedExercises([
      ...selectedExercises,
      {
        ...exercise,
        sets: 3,
        reps: 10,
        weight: 0,
        rest: 60,
        notes: "",
      },
    ]);
    showToast(`Added ${exercise.exercise} to template`, "success");
  };

  // Remove exercise from template
  const removeExerciseFromTemplate = (index) => {
    const newSelectedExercises = [...selectedExercises];
    newSelectedExercises.splice(index, 1);
    setSelectedExercises(newSelectedExercises);
    showToast("Exercise removed from template", "info");
  };

  // Update exercise details in template
  const updateExerciseDetail = (index, field, value) => {
    const newSelectedExercises = [...selectedExercises];
    newSelectedExercises[index] = {
      ...newSelectedExercises[index],
      [field]: value,
    };
    setSelectedExercises(newSelectedExercises);
  };

  // Save the workout template
  const handleSaveWorkoutTemplate = async () => {
    if (!templateName.trim()) {
      showToast("Please enter a template name", "error");
      return;
    }

    if (selectedExercises.length === 0) {
      showToast("Please add at least one exercise to your template", "error");
      return;
    }

    setIsSaving(true);
    try {
      await initClient(accessToken);
      
      // Save using saveWorkoutTemplate function
      await saveWorkoutTemplate(templateName, selectedExercises);
      
      showToast("Workout template saved successfully!", "success");
      setSaveDialogOpen(false);
      
      // Clear form after saving
      setTimeout(() => {
        setTemplateName("");
        setSelectedExercises([]);
      }, 1000);
    } catch (error) {
      console.error("Error saving workout template:", error);
      showToast("Failed to save workout template", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Show toast message
  const showToast = (message, severity = "info") => {
    setToast({
      open: true,
      message,
      severity,
    });
  };

  // Handle toast close
  const handleToastClose = () => {
    setToast({
      ...toast,
      open: false,
    });
  };

  return (
    <div className="workout-template-builder">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Workout Template Builder
          </Typography>
          <Button color="inherit" onClick={() => onNavigate("workoutTemplates")}>
            Templates
          </Button>
          <Button color="inherit" onClick={() => onNavigate("dashboard")}>
            Dashboard
          </Button>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Grid container spacing={2} sx={{ p: 2 }}>
        {/* Left side - Exercise List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "calc(100vh - 100px)", overflow: "auto" }}>
            <Typography variant="h6" gutterBottom>
              Exercise List
            </Typography>
            
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Autocomplete
                options={muscleGroups}
                value={muscleGroupFilter}
                onChange={(event, newValue) => {
                  muscleGroupRef.current = { value: newValue };
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Muscle Group"
                    variant="outlined"
                    fullWidth
                  />
                )}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Search Exercise"
                variant="outlined"
                defaultValue={exerciseFilter}
                inputRef={exerciseSearchRef}
                onChange={() => {}}
                fullWidth
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ minWidth: "100px" }}
              >
                Search
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && exercises.length === 0 ? (
              <Typography variant="body1">
                Please use the search filters above and click "Search" to load exercises.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {filteredExercises.map(
                  (exercise, index) =>
                    exercise.relativePath && (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card 
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}
                        >
                          <CardActionArea
                            onClick={() => addExerciseToTemplate(exercise)}
                          >
                            <CardMedia
                              component="img"
                              image={exercise.imageLink}
                              alt={exercise.exercise}
                              sx={{
                                height: "150px",
                                objectFit: "cover",
                              }}
                            />
                            <CardContent>
                              <Typography variant="subtitle1" noWrap>
                                {exercise.exercise}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="textSecondary"
                              >
                                {exercise.muscleGroup}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                          <Box sx={{ mt: 'auto', p: 1 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              startIcon={<Add />}
                              onClick={() => addExerciseToTemplate(exercise)}
                              size="small"
                            >
                              Add
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    )
                )}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Right side - Selected Exercises */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "calc(100vh - 100px)", overflow: "auto" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">
                Workout Template
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={() => setSaveDialogOpen(true)}
                disabled={selectedExercises.length === 0}
              >
                Save Template
              </Button>
            </Box>

            {selectedExercises.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: "center", my: 4 }}>
                Click on exercises from the left to add them to your template.
              </Typography>
            ) : (
              <>
                <List>
                  {selectedExercises.map((exercise, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        sx={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                          py: 2,
                        }}
                      >
                        <Box sx={{ 
                          display: "flex", 
                          width: "100%", 
                          justifyContent: "space-between",
                          mb: 1
                        }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {exercise.exercise}
                          </Typography>
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => removeExerciseFromTemplate(index)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {exercise.muscleGroup}
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Sets"
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExerciseDetail(index, "sets", parseInt(e.target.value) || 0)}
                              InputProps={{
                                inputProps: { min: 1, max: 20 }
                              }}
                              variant="outlined"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Reps"
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExerciseDetail(index, "reps", parseInt(e.target.value) || 0)}
                              InputProps={{
                                inputProps: { min: 1, max: 100 }
                              }}
                              variant="outlined"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Weight"
                              type="number"
                              value={exercise.weight}
                              onChange={(e) => updateExerciseDetail(index, "weight", parseFloat(e.target.value) || 0)}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">lbs</InputAdornment>,
                                inputProps: { min: 0 }
                              }}
                              variant="outlined"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <TextField
                              label="Rest"
                              type="number"
                              value={exercise.rest}
                              onChange={(e) => updateExerciseDetail(index, "rest", parseInt(e.target.value) || 0)}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">sec</InputAdornment>,
                                inputProps: { min: 0 }
                              }}
                              variant="outlined"
                              size="small"
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="Notes"
                              value={exercise.notes || ""}
                              onChange={(e) => updateExerciseDetail(index, "notes", e.target.value)}
                              variant="outlined"
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                            />
                          </Grid>
                        </Grid>
                      </ListItem>
                      {index < selectedExercises.length - 1 && (
                        <Divider variant="fullWidth" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Workout Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            variant="outlined"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveWorkoutTemplate} 
            variant="contained" 
            color="primary"
            disabled={isSaving || !templateName.trim()}
          >
            {isSaving ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleToastClose} severity={toast.severity}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WorkoutTemplateBuilder;