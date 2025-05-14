import React, { useState, useEffect } from "react";
import { 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Grid, 
  AppBar, 
  Toolbar, 
  TextField, 
  Box, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Autocomplete
} from "@mui/material";
import { 
  Brightness4, 
  Brightness7, 
  Delete, 
  Edit, 
  Add, 
  PlayArrow,
  Save
} from "@mui/icons-material";
import { 
  fetchWorkoutTemplates, 
  saveWorkoutTemplate, 
  updateWorkoutTemplate, 
  deleteWorkoutTemplate,
  saveTodaysWorkout,
  fetchData
} from "../utils/sheetsApi";
import { initClient } from "../utils/sheetsApi";
import "../styles.css";

const WorkoutTemplates = ({ accessToken, onNavigate, toggleTheme, themeMode }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState({ 
    name: "", 
    muscleGroup: "",
    sets: 3, 
    reps: 10, 
    weight: "" 
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Exercise library data
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [exerciseOptions, setExerciseOptions] = useState([]);

  // Load templates when component mounts
  useEffect(() => {
    if (accessToken) {
      loadTemplates();
      loadExerciseLibrary();
    }
  }, [accessToken]);

  // Load templates from Google Sheets
  const loadTemplates = async () => {
    setLoading(true);
    try {
      await initClient(accessToken);
      const templatesData = await fetchWorkoutTemplates();
      
      // Add rowIndex to each template for easier updates/deletes
      const templatesWithIndex = templatesData.map((template, index) => ({
        ...template,
        rowIndex: index + 2 // Adding 2 because the first row is headers
      }));
      
      setTemplates(templatesWithIndex);
    } catch (error) {
      console.error("Error loading templates:", error);
      setSnackbar({
        open: true,
        message: "Failed to load workout templates",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load exercise library from Google Sheets
  const loadExerciseLibrary = async () => {
    try {
      await initClient(accessToken);
      const exercises = await fetchData(
        "Exercises!A2:D",
        (row) => ({
          muscleGroup: row[0],
          exercise: row[1],
          exerciseLink: row[2],
          imageLink: row[3],
        })
      );
      
      setExerciseLibrary(exercises);
      
      // Extract unique muscle groups
      const uniqueMuscleGroups = [...new Set(exercises.map(ex => ex.muscleGroup))].sort();
      setMuscleGroups(uniqueMuscleGroups);
      
      // Set initial exercise options to all exercises
      setExerciseOptions(exercises.map(ex => ex.exercise));
      
    } catch (error) {
      console.error("Error loading exercise library:", error);
      setSnackbar({
        open: true,
        message: "Failed to load exercise library",
        severity: "error"
      });
    }
  };

  // Handle selecting muscle group - filter exercises by the selected muscle group
  const handleMuscleGroupChange = (event, newValue) => {
    setCurrentExercise({...currentExercise, muscleGroup: newValue || ""});
    
    // Filter exercise options based on selected muscle group
    if (newValue) {
      const filteredExercises = exerciseLibrary
        .filter(ex => ex.muscleGroup === newValue)
        .map(ex => ex.exercise);
      setExerciseOptions(filteredExercises);
    } else {
      // If no muscle group is selected, show all exercises
      setExerciseOptions(exerciseLibrary.map(ex => ex.exercise));
    }
  };

  // Handle selecting exercise - automatically set the corresponding muscle group
  const handleExerciseChange = (event, newValue) => {
    setCurrentExercise({...currentExercise, name: newValue || ""});
    
    // If an exercise is selected, find and set its muscle group
    if (newValue) {
      const selectedExercise = exerciseLibrary.find(ex => ex.exercise === newValue);
      if (selectedExercise) {
        setCurrentExercise(prev => ({
          ...prev, 
          name: newValue,
          muscleGroup: selectedExercise.muscleGroup
        }));
      }
    }
  };

  // Handle opening dialog for new template
  const handleNewTemplate = () => {
    setEditMode(false);
    setCurrentTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setExercises([]);
    setOpenDialog(true);
  };

  // Handle editing a template
  const handleEditTemplate = (template) => {
    setEditMode(true);
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setExercises(template.exercises || []);
    setOpenDialog(true);
  };

  // Handle adding an exercise to the template
  const handleAddExercise = () => {
    if (!currentExercise.name) return;
    
    setExercises([...exercises, { ...currentExercise }]);
    setCurrentExercise({ name: "", muscleGroup: "", sets: 3, reps: 10, weight: "" });
  };

  // Handle removing an exercise from the template
  const handleRemoveExercise = (index) => {
    const updatedExercises = [...exercises];
    updatedExercises.splice(index, 1);
    setExercises(updatedExercises);
  };

  // Handle saving a template
  const handleSaveTemplate = async () => {
    if (!templateName || exercises.length === 0) {
      setSnackbar({
        open: true,
        message: "Template name and at least one exercise are required",
        severity: "error"
      });
      return;
    }

    setLoading(true);
    try {
      const template = {
        name: templateName,
        description: templateDescription,
        exercises: exercises,
        createdAt: new Date().toISOString(),
        lastUsed: ""
      };

      if (editMode && currentTemplate) {
        // Update existing template
        await updateWorkoutTemplate(currentTemplate.rowIndex - 2, template);
        setSnackbar({
          open: true,
          message: "Workout template updated successfully",
          severity: "success"
        });
      } else {
        // Create new template
        await saveWorkoutTemplate(template);
        setSnackbar({
          open: true,
          message: "Workout template created successfully",
          severity: "success"
        });
      }

      setOpenDialog(false);
      loadTemplates(); // Reload the templates
    } catch (error) {
      console.error("Error saving template:", error);
      setSnackbar({
        open: true,
        message: "Failed to save workout template",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteWorkoutTemplate(template.rowIndex - 2);
      setSnackbar({
        open: true,
        message: "Workout template deleted successfully",
        severity: "success"
      });
      loadTemplates(); // Reload the templates
    } catch (error) {
      console.error("Error deleting template:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete workout template",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle starting a workout from a template
  const handleStartWorkout = async (template) => {
    setLoading(true);
    try {
      // Create a copy of the template exercises with additional tracking fields
      const workoutExercises = template.exercises.map(exercise => ({
        ...exercise,
        setsCompleted: 0,
        notes: ""
      }));

      const workoutData = {
        templateName: template.name,
        templateId: template.rowIndex,
        exercises: workoutExercises,
        startTime: new Date().toISOString(),
        endTime: null
      };

      await saveTodaysWorkout(workoutData);
      
      // Update lastUsed timestamp for the template
      const updatedTemplate = {
        ...template,
        lastUsed: new Date().toISOString()
      };
      await updateWorkoutTemplate(template.rowIndex - 2, updatedTemplate);
      
      setSnackbar({
        open: true,
        message: "Today's workout started successfully",
        severity: "success"
      });
      
      // Navigate to today's workout page
      onNavigate("todaysWorkout");
    } catch (error) {
      console.error("Error starting workout:", error);
      setSnackbar({
        open: true,
        message: "Failed to start workout",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workout-templates-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Workout Templates
          </Typography>
          <Button color="inherit" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </Button>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <div className="workout-templates-content" style={{ padding: "20px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">My Workout Templates</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={handleNewTemplate}
          >
            Create Template
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: "center", my: 4 }}>
            You haven't created any workout templates yet. Click "Create Template" to get started.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.rowIndex}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description || "No description"}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Exercises ({template.exercises?.length || 0}):
                    </Typography>
                    <List dense>
                      {template.exercises?.slice(0, 3).map((exercise, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemText 
                            primary={exercise.name} 
                            secondary={`${exercise.sets} sets x ${exercise.reps} reps ${exercise.weight ? `@ ${exercise.weight}` : ''}`} 
                          />
                        </ListItem>
                      ))}
                      {template.exercises?.length > 3 && (
                        <ListItem disableGutters>
                          <ListItemText 
                            primary={`+${template.exercises.length - 3} more exercises`} 
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                    {template.lastUsed && (
                      <Typography variant="caption" color="text.secondary">
                        Last used: {new Date(template.lastUsed).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<PlayArrow />}
                      onClick={() => handleStartWorkout(template)}
                      color="primary"
                    >
                      Start Workout
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditTemplate(template)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteTemplate(template)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Template Edit/Create Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {editMode ? "Edit Workout Template" : "Create Workout Template"}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Exercises
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mb: 2 }}>
              <Autocomplete
                options={muscleGroups}
                value={currentExercise.muscleGroup}
                onChange={handleMuscleGroupChange}
                renderInput={(params) => <TextField {...params} label="Muscle Group" />}
                sx={{ flexGrow: 1 }}
              />
              <Autocomplete
                options={exerciseOptions}
                value={currentExercise.name}
                onChange={handleExerciseChange}
                renderInput={(params) => <TextField {...params} label="Exercise Name" />}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                label="Sets"
                type="number"
                value={currentExercise.sets}
                onChange={(e) => setCurrentExercise({...currentExercise, sets: parseInt(e.target.value) || 0})}
                sx={{ width: '80px' }}
              />
              <TextField
                label="Reps"
                type="number"
                value={currentExercise.reps}
                onChange={(e) => setCurrentExercise({...currentExercise, reps: parseInt(e.target.value) || 0})}
                sx={{ width: '80px' }}
              />
              <TextField
                label="Weight"
                value={currentExercise.weight}
                onChange={(e) => setCurrentExercise({...currentExercise, weight: e.target.value})}
                sx={{ width: '100px' }}
                placeholder="Optional"
              />
              <Button 
                variant="contained" 
                onClick={handleAddExercise}
                startIcon={<Add />}
              >
                Add
              </Button>
            </Box>
            
            <List>
              {exercises.map((exercise, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={exercise.name}
                      secondary={`${exercise.muscleGroup} - ${exercise.sets} sets x ${exercise.reps} reps ${exercise.weight ? `@ ${exercise.weight}` : ''}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveExercise(index)} color="error">
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < exercises.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {exercises.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No exercises added yet. Add at least one exercise to save this template.
                </Typography>
              )}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveTemplate} 
              variant="contained" 
              disabled={!templateName || exercises.length === 0}
              startIcon={<Save />}
            >
              Save Template
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

export default WorkoutTemplates;