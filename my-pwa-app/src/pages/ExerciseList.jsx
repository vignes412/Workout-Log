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
  Autocomplete,
  TextField,
  Box,
  IconButton,
  Avatar,
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
            "Exercises!A2:O",
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
    <Box className="main-container">
      <Box className="header">
        <Typography className="header-greeting">Exercise List</Typography>
        <TextField
          className="header-search"
          placeholder="Search anything here..."
          variant="outlined"
          size="small"
        />
        <Box className="header-profile">
          <Avatar alt="User" src="/path-to-profile-pic.jpg" />
          <Typography>User Name</Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {themeMode === "light" ? <Brightness4 /> : <Brightness7 />}
          </IconButton>
        </Box>
      </Box>

      <Box className="card">
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
              <Typography className="card-title">{muscleGroup}</Typography>
              <Grid container spacing={2}>
                {filteredGroupedExercises[muscleGroup].map(
                  (exercise, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card className="card">
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
                              Secondary Muscle: {exercise.secondaryMuscleGroup}
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
      </Box>

      <div className="bottom-menu">
        <div
          className="bottom-menu-item"
          onClick={() => onNavigate("dashboard")}
        >
          Dashboard
        </div>
        <div
          className="bottom-menu-item"
          onClick={() => onNavigate("exerciselist")}
        >
          Exercises
        </div>
        <div
          className="bottom-menu-item"
          onClick={() => onNavigate("bodymeasurements")}
        >
          Body Measurements
        </div>
        <div
          className="bottom-menu-item"
          onClick={() => onNavigate("settings")}
        >
          Settings
        </div>
      </div>
    </Box>
  );
};

export default ExerciseList;
