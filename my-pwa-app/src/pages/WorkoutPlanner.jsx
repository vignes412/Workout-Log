import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
} from "@mui/material";
import { syncData } from "../utils/sheetsApi";
import WorkoutLogModal from "./WorkoutLogModal";
import {
  prepareData,
  trainModel,
  predictFatigue,
} from "../utils/tensorflowModel";

const WorkoutPlanner = ({ accessToken, onNavigate, logs }) => {
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [oneRM, setOneRM] = useState({
    squat: "",
    deadlift: "",
  });
  const [workoutPlan, setWorkoutPlan] = useState(() => {
    const savedPlan = localStorage.getItem("workoutPlan");
    return savedPlan ? JSON.parse(savedPlan) : null;
  });
  const [openModal, setOpenModal] = useState(false);
  const [modalEditLog, setModalEditLog] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [aiGeneratedPlan, setAiGeneratedPlan] = useState(null);

  // Fetch exercises from Google Sheets
  useEffect(() => {
    if (accessToken) {
      const loadExercises = async () => {
        try {
          await syncData(
            "Exercises!A2:D",
            "/api/exercises",
            setExercises,
            (row) => ({
              muscleGroup: row[0],
              exercise: row[1],
              exerciseLink: row[2],
              imageLink: row[3] || "https://via.placeholder.com/300x200",
            })
          );
        } catch (error) {
          console.error("Error loading exercises:", error);
        }
      };
      loadExercises();
    }
  }, [accessToken]);

  // Update muscle groups when exercises load
  useEffect(() => {
    if (exercises.length > 0) {
      const uniqueMuscleGroups = [
        ...new Set(exercises.map((ex) => ex.muscleGroup)),
      ].sort();
      setMuscleGroups(uniqueMuscleGroups);
    }
  }, [exercises]);

  // Handle muscle group selection
  const handleMuscleChange = (event) => {
    setSelectedMuscles(event.target.value);
    setWorkoutPlan(null);
    localStorage.removeItem("workoutPlan");
  };

  // Handle 1RM input changes
  const handleOneRMChange = (event) => {
    const { name, value } = event.target;
    setOneRM((prev) => ({ ...prev, [name]: value }));
    setWorkoutPlan(null);
    localStorage.removeItem("workoutPlan");
  };

  // Generate workout plan
  const generateWorkoutPlan = () => {
    if (selectedMuscles.length === 0 || exercises.length === 0) {
      alert(
        "Please select at least one muscle group and ensure exercises are loaded."
      );
      return;
    }

    const plan = [];
    const oneRMs = {
      squat: oneRM.squat ? parseFloat(oneRM.squat) : 70,
      deadlift: oneRM.deadlift ? parseFloat(oneRM.deadlift) : 90,
    };

    selectedMuscles.forEach((muscle) => {
      const muscleExercises = exercises.filter(
        (ex) => ex.muscleGroup.toLowerCase() === muscle.toLowerCase()
      );
      if (muscleExercises.length === 0) return; // Skip if no exercises available

      const selectedExercises = muscleExercises
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3, muscleExercises.length));

      selectedExercises.forEach((exercise) => {
        let base1RM = 70;
        if (["quads", "hamstrings", "calves"].includes(muscle.toLowerCase())) {
          base1RM = oneRMs.squat;
        } else if (["back", "abs"].includes(muscle.toLowerCase())) {
          base1RM = oneRMs.deadlift;
        } else if (
          ["chest", "shoulders", "biceps", "triceps"].includes(
            muscle.toLowerCase()
          )
        ) {
          base1RM = oneRMs.deadlift * 0.5;
        }

        const weight = Math.round(base1RM * 0.7);
        plan.push({
          muscleGroup: muscle,
          exercise: exercise.exercise,
          sets: 3,
          reps: 8,
          weight: `${weight} kg`,
          imageLink: exercise.imageLink,
        });
      });
    });

    setWorkoutPlan(plan);
    localStorage.setItem("workoutPlan", JSON.stringify(plan));
  };

  // Generate AI workout plan
  const generateAIWorkoutPlan = async () => {
    if (!logs || logs.length === 0) {
      alert("No historical data available to generate a plan.");
      return;
    }

    const { inputTensor, labelTensor } = prepareData(logs);
    const model = await trainModel(inputTensor, labelTensor);

    const muscleGroups = [...new Set(exercises.map((ex) => ex.muscleGroup))];
    const plan = [];

    for (const muscle of muscleGroups) {
      const muscleExercises = exercises.filter(
        (ex) => ex.muscleGroup.toLowerCase() === muscle.toLowerCase()
      );

      const selectedExercise =
        muscleExercises[Math.floor(Math.random() * muscleExercises.length)];

      // Use historical data to predict optimal reps and weight
      const historicalInputs = logs
        .filter((log) => log[1].toLowerCase() === muscle.toLowerCase())
        .map((log) => [parseFloat(log[3]) || 0, parseFloat(log[4]) || 0]);

      const predictions = predictFatigue(model, historicalInputs);
      const optimalIndex = predictions.indexOf(Math.min(...predictions));
      const recommendedReps = historicalInputs[optimalIndex]?.[0] || 10;
      const recommendedWeight = historicalInputs[optimalIndex]?.[1] || 50;

      // Analyze fatigue levels for the muscle group
      const fatigueLogs = logs.filter(
        (log) => log[1].toLowerCase() === muscle.toLowerCase()
      );
      const totalFatigue = fatigueLogs.reduce(
        (sum, log) => sum + (parseFloat(log[5]) || 0),
        0
      );
      const averageFatigue = (totalFatigue / fatigueLogs.length).toFixed(2);

      // Calculate progression rate
      const previousVolume = fatigueLogs.reduce(
        (sum, log) =>
          sum + (parseFloat(log[3]) || 0) * (parseFloat(log[4]) || 0),
        0
      );
      const progressionRate = previousVolume
        ? (
            ((recommendedReps * recommendedWeight - previousVolume) /
              previousVolume) *
            100
          ).toFixed(2)
        : "N/A";

      // Adjust workload based on progression rate and fatigue
      const adjustedReps =
        progressionRate !== "N/A" && progressionRate < 10
          ? recommendedReps + 2
          : recommendedReps;
      const adjustedWeight =
        progressionRate !== "N/A" && progressionRate < 10
          ? recommendedWeight + 5
          : recommendedWeight;

      // Provide actionable insights
      const insight =
        averageFatigue > 7
          ? "High fatigue detected. Consider reducing intensity or taking a rest day."
          : "Fatigue levels are manageable. Proceed with the workout.";

      plan.push({
        muscleGroup: muscle,
        exercise: selectedExercise.exercise,
        sets: 3,
        reps: adjustedReps,
        weight: `${adjustedWeight} kg`,
        fatigue: averageFatigue,
        progressionRate,
        insight,
        imageLink: selectedExercise.imageLink,
      });
    }

    setAiGeneratedPlan(plan);
  };

  // Handle card click to open modal with today's date
  const handleCardClick = (exercise) => {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const newLog = {
      date: today, // Always today's date
      muscleGroup: exercise.muscleGroup,
      exercise: exercise.exercise,
      reps: exercise.reps.toString(),
      weight: exercise.weight.replace(" kg", ""),
      rating: "",
    };
    setModalEditLog(newLog);
    setOpenModal(true);
  };

  return (
    <Box
      sx={{
        mt: 4,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Workout Planner Generator
      </Typography>
      <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Target Muscle Groups</InputLabel>
            <Select
              multiple
              value={selectedMuscles}
              onChange={handleMuscleChange}
              renderValue={(selected) => selected.join(", ")}
            >
              {muscleGroups.map((muscle) => (
                <MenuItem key={muscle} value={muscle}>
                  <Checkbox checked={selectedMuscles.indexOf(muscle) > -1} />
                  <ListItemText primary={muscle} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle1" gutterBottom>
            Enter Your 1RM (in kg, Optional)
          </Typography>
          <TextField
            label="Squat 1RM (kg)"
            name="squat"
            value={oneRM.squat}
            onChange={handleOneRMChange}
            type="number"
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Deadlift 1RM (kg)"
            name="deadlift"
            value={oneRM.deadlift}
            onChange={handleOneRMChange}
            type="number"
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateWorkoutPlan}
              disabled={selectedMuscles.length === 0}
            >
              Generate Workout Plan
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => onNavigate("dashboard")}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {workoutPlan && (
          <Grid container spacing={3}>
            {workoutPlan.map((exercise, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                  }}
                  onClick={() => handleCardClick(exercise)}
                >
                  <CardMedia
                    component="img"
                    image={exercise.imageLink}
                    alt={exercise.exercise}
                    sx={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      maxHeight: "300px",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200";
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6">{exercise.exercise}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muscle Group: {exercise.muscleGroup}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sets: {exercise.sets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reps: {exercise.reps}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weight: {exercise.weight}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        AI-Generated Weekly Workout Plan
      </Typography>
      <Paper elevation={3} sx={{ p: 2, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateAIWorkoutPlan}
          >
            Generate AI Workout Plan
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => onNavigate("dashboard")}
            sx={{ ml: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>

        {aiGeneratedPlan && (
          <Grid container spacing={3}>
            {aiGeneratedPlan.map((exercise, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={exercise.imageLink}
                    alt={exercise.exercise}
                    sx={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      maxHeight: "300px",
                    }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200";
                    }}
                  />
                  <CardContent>
                    <Typography variant="h6">{exercise.exercise}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muscle Group: {exercise.muscleGroup}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sets: {exercise.sets}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reps: {exercise.reps}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weight: {exercise.weight}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fatigue: {exercise.fatigue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progression Rate: {exercise.progressionRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Insight: {exercise.insight}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <WorkoutLogModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setModalEditLog(null);
        }}
        exercises={exercises}
        isOffline={isOffline}
        editLog={modalEditLog}
      />
    </Box>
  );
};

export default WorkoutPlanner;
