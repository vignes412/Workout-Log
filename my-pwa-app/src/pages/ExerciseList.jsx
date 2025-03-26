import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import "../styles.css";

const ExerciseList = ({ accessToken, onNavigate, toggleTheme, themeMode }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muscleGroupFilter, setMuscleGroupFilter] = useState(null);
  const [exerciseFilter, setExerciseFilter] = useState("");

  useEffect(() => {
    if (accessToken) {
      const loadExercises = async () => {
        try {
          await initClient(accessToken);
          await syncData(
            "Exercises!A2:D",
            "/api/exercises",
            setExercises,
            (row) => ({
              muscleGroup: row[0],
              exercise: row[1],
              exerciseLink: row[2],
              imageLink: row[3],
            })
          );
        } catch (error) {
          console.error("Error loading exercises:", error);
        } finally {
          setLoading(false);
        }
      };
      loadExercises();
    }
  }, [accessToken]);

  const groupedExercises = exercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = [];
    }
    acc[exercise.muscleGroup].push(exercise);
    return acc;
  }, {});

  const muscleGroups = Object.keys(groupedExercises).sort();

  const filteredExercises = exercises.filter((exercise) => {
    const matchesMuscleGroup =
      !muscleGroupFilter || exercise.muscleGroup === muscleGroupFilter;
    const matchesExercise =
      !exerciseFilter ||
      exercise.exercise.toLowerCase().includes(exerciseFilter.toLowerCase());
    return matchesMuscleGroup && matchesExercise;
  });

  const filteredGroupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = [];
    }
    acc[exercise.muscleGroup].push(exercise);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading Exercises...</div>;
  }

  return (
    <div className="exercise-list-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Exercise List
          </Typography>
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
            options={muscleGroups}
            value={muscleGroupFilter}
            onChange={(event, newValue) => {
              setMuscleGroupFilter(newValue);
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
            value={exerciseFilter}
            onChange={(e) => setExerciseFilter(e.target.value)}
            fullWidth
            sx={{ flex: 1, minWidth: 0 }}
          />
        </Box>

        {Object.keys(filteredGroupedExercises).length > 0 ? (
          Object.keys(filteredGroupedExercises).map((muscleGroup) => (
            <div key={muscleGroup} style={{ marginBottom: "30px" }}>
              <Typography variant="h5" gutterBottom>
                {muscleGroup}
              </Typography>
              <Grid container spacing={2}>
                {filteredGroupedExercises[muscleGroup].map(
                  (exercise, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
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
