import React, { useState, useRef } from "react";
import { initClient, syncData } from "../utils/sheetsApi";
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
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import "../styles.css";

const ExerciseList = ({ accessToken, onNavigate, toggleTheme, themeMode }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState(null);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [muscleGroups, setMuscleGroups] = useState([]); // State for muscle groups

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
        "Exercises!A2:A", // Only load the muscle group column
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
    } finally {
      setLoading(false);
    }
  };

  // Load muscle groups on component mount
  React.useEffect(() => {
    loadMuscleGroups();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    // Update state only when Search is clicked
    setMuscleGroupFilter(muscleGroupRef.current?.value || null);
    setExerciseFilter(exerciseSearchRef.current.value || "");
    loadExercises();
  };

  const groupedExercises = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = [];
    }
    acc[exercise.muscleGroup].push(exercise);
    return acc;
  }, {});

  const filteredExercises = exercises.filter((exercise) => {
    const matchesMuscleGroup =
      !muscleGroupFilter ||
      exercise.muscleGroup?.toLowerCase() === muscleGroupFilter.toLowerCase();
    const matchesExercise =
      !exerciseFilter ||
      exercise.exercise?.toLowerCase().includes(exerciseFilter.toLowerCase());
    return matchesMuscleGroup && matchesExercise; // Ensure both filters are applied
  });

  const filteredGroupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = [];
    }
    acc[exercise.muscleGroup].push(exercise);
    return acc;
  }, {});

  return (
    <div className="exercise-list-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Exercise List
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => onNavigate("workoutTemplateBuilder")}
            sx={{ mr: 1 }}
          >
            Create Workout
          </Button>
          <Button color="inherit" onClick={() => onNavigate("dashboard")}>
            Back to Dashboard
          </Button>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <div className="exercise-list-content" style={{ padding: "20px" }}>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Autocomplete
            options={muscleGroups} // Use loaded muscle groups
            value={muscleGroupFilter} // Controlled by state, updated only on Search
            onChange={(event, newValue) => {
              // Temporarily store in ref, don't update state
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
            sx={{ flex: 1, minWidth: 0 }}
          />
          <TextField
            label="Search Exercise"
            variant="outlined"
            defaultValue={exerciseFilter} // Controlled indirectly via ref
            inputRef={exerciseSearchRef} // Use ref to capture value
            onChange={() => {}} // Empty handler to prevent state updates
            fullWidth
            sx={{ flex: 1, minWidth: 0 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ minWidth: "100px" }}
          >
            Search
          </Button>
        </Box>

        {/* Loader below search boxes */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {exercises.length === 0 && !loading ? (
          <Typography variant="body1">
            Please use the search filters above and click "Search" to load
            exercises.
          </Typography>
        ) : Object.keys(filteredGroupedExercises).length > 0 ? (
          Object.keys(filteredGroupedExercises).map((muscleGroup) => (
            <div key={muscleGroup} style={{ marginBottom: "30px" }}>
              <Typography variant="h5" gutterBottom>
                {muscleGroup}
              </Typography>
              <Grid container spacing={2}>
                {filteredGroupedExercises[muscleGroup].map(
                  (exercise, index) =>
                    exercise.relativePath && (
                      <Grid item xs={12} sm={2} md={2} key={index}>
                        <Card>
                          <CardActionArea
                            onClick={() =>
                              window.open(exercise.exerciseLink, "_blank")
                            }
                          >
                            <CardMedia
                              component="img"
                              image={exercise.imageLink}
                              alt={exercise.exercise}
                              style={{
                                height: "200px",
                                width: "200px",
                                objectFit: "cover",
                                margin: "0 auto",
                              }}
                            />
                            <CardContent>
                              <Typography variant="h6" align="center">
                                {exercise.exercise}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                align="center"
                              >
                                {exercise.muscleGroup}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Difficulty: {exercise.difficultyLevel}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Equipment: {exercise.equipmentRequired}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Intensity: {exercise.targetIntensity}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Primary Muscle: {exercise.primaryMuscleGroup}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Secondary Muscle:{" "}
                                {exercise.secondaryMuscleGroup}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Duration: {exercise.exerciseDuration}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Recovery: {exercise.recoveryTime}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Type: {exercise.exerciseType}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Calories Burned: {exercise.caloriesBurned}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Progression: {exercise.exerciseProgression}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Injury Risk: {exercise.injuryRiskLevel}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    )
                )}
              </Grid>
            </div>
          ))
        ) : (
          <Typography variant="body1">
            No exercises match your filters.
          </Typography>
        )}
      </div>
    </div>
  );
};

export default ExerciseList;
