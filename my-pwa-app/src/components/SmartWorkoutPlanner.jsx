import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { syncData } from "../utils/sheetsApi";
import {
  prepareEnhancedData,
  trainEnhancedModel,
  predictOptimalWorkout,
  analyzeHistoricalData,
} from "../utils/tensorflowModel";

const SmartWorkoutPlanner = ({ accessToken, onNavigate }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [targetVolume, setTargetVolume] = useState(15000); // Default target volume
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await syncData(
          "Workout_Logs!A2:F",
          "/api/workout",
          setWorkoutLogs,
          (row) => ({
            date: row[0],
            muscleGroup: row[1],
            exercise: row[2],
            reps: parseFloat(row[3]) || 0,
            weight: parseFloat(row[4]) || 0,
            RPE: parseFloat(row[5]) || 7,
          })
        );

        await syncData(
          "Exercises!A2:O",
          "/api/exercises",
          setExercises,
          (row) => ({
            muscleGroup: row[0],
            exercise: row[1],
            difficultyLevel:
              row[2] === "Hard" ? 3 : row[2] === "Medium" ? 2 : 1,
            equipmentRequired: row[3] || "None",
            targetIntensity:
              row[4] === "N/A" ? 0 : parseFloat(row[4].replace("%", "")) / 100,
            primaryMuscleGroup: row[5] || row[0],
            secondaryMuscleGroup: row[6] || "",
            exerciseDuration: parseFloat(row[7]) || 2,
            recoveryTime: parseFloat(row[8]) || 60,
            exerciseType: row[9] || "Strength",
            caloriesBurned: parseFloat(row[10]) || 5,
            exerciseProgression: row[11] || "Increase weight",
            injuryRiskLevel:
              row[12] === "High" ? 3 : row[12] === "Medium" ? 2 : 1,
            exerciseLink: row[13],
            image: row[14],
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (accessToken) fetchData();
  }, [accessToken]);

  const calculate1RM = (weight, reps) => weight * (1 + reps / 30);

  const prepareCombinedData = () => {
    return workoutLogs.map((log) => {
      const exerciseDetail =
        exercises.find(
          (ex) =>
            ex.exercise === log.exercise && ex.muscleGroup === log.muscleGroup
        ) || {};
      return [
        log.date,
        log.muscleGroup,
        log.exercise,
        exerciseDetail.difficultyLevel || 1,
        exerciseDetail.equipmentRequired || "None",
        exerciseDetail.targetIntensity || 0,
        exerciseDetail.primaryMuscleGroup || log.muscleGroup,
        exerciseDetail.secondaryMuscleGroup || "",
        exerciseDetail.exerciseDuration || 2,
        exerciseDetail.recoveryTime || 60,
        exerciseDetail.exerciseType || "Strength",
        exerciseDetail.caloriesBurned || 5,
        exerciseDetail.exerciseProgression || "Increase weight",
        exerciseDetail.injuryRiskLevel || 1,
        log.reps,
        log.weight,
        log.RPE,
      ];
    });
  };

  const generateWeeklyPlan = async () => {
    setLoading(true);
    const combinedLogs = prepareCombinedData();
    const { inputTensor, labelTensor } = prepareEnhancedData(combinedLogs);
    const model = await trainEnhancedModel(inputTensor, labelTensor);
    const historicalAnalysis = analyzeHistoricalData(combinedLogs);

    const muscleGroupCombos = {
      "Chest-Shoulders-Triceps": ["Chest", "Shoulders", "Triceps"],
      "Back-Biceps": ["Back", "Biceps"],
      "Legs-Abs": ["Legs", "Abs"],
    };
    const otherMuscles = exercises
      .map((ex) => ex.muscleGroup)
      .filter(
        (mg) =>
          ![
            "Chest",
            "Shoulders",
            "Triceps",
            "Back",
            "Biceps",
            "Legs",
            "Abs",
          ].includes(mg)
      );

    const availableExercises = exercises.filter(
      (ex) =>
        selectedEquipment.length === 0 ||
        selectedEquipment.includes(ex.equipmentRequired)
    );
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const plan = [];
    const usedExercises = new Set(["Push-Ups", "Pull-Ups"]);
    let totalVolume = 0;

    const dayAssignments = [
      "Chest-Shoulders-Triceps",
      "Back-Biceps",
      "Legs-Abs",
      "Chest-Shoulders-Triceps",
      "Back-Biceps",
      "Legs-Abs",
    ];

    // Step 1: Generate initial plan with base volumes
    for (let i = 0; i < days.length; i++) {
      const dayPlan = { day: days[i], exercises: [] };
      const comboKey = dayAssignments[i];
      const muscles = muscleGroupCombos[comboKey] || otherMuscles;
      const exercisesForCombo = availableExercises.filter((ex) =>
        muscles.includes(ex.muscleGroup)
      );

      for (const muscle of muscles) {
        const muscleExercises = exercisesForCombo.filter(
          (ex) => ex.muscleGroup === muscle
        );
        let exerciseCount = 0;

        while (exerciseCount < 2 && muscleExercises.length > 0) {
          let exercise;
          do {
            exercise =
              muscleExercises[
                Math.floor(Math.random() * muscleExercises.length)
              ];
          } while (
            usedExercises.has(exercise.exercise) &&
            muscleExercises.length > usedExercises.size
          );

          if (!exercise || usedExercises.has(exercise.exercise)) break;
          usedExercises.add(exercise.exercise);

          const pastLogs = combinedLogs.filter(
            (log) => log[2] === exercise.exercise && log[1] === muscle
          );
          const latestLog = pastLogs.slice(-1)[0];

          let newWeight, newReps, newSets;
          if (latestLog) {
            const input = [
              latestLog[14],
              latestLog[15],
              exercise.difficultyLevel,
              exercise.targetIntensity,
              exercise.exerciseDuration,
              exercise.recoveryTime,
              exercise.caloriesBurned,
              exercise.injuryRiskLevel,
            ];
            const prediction = predictOptimalWorkout(model, [input])[0][0];
            const oneRM = calculate1RM(latestLog[15], latestLog[14]);
            newWeight = Math.min(prediction * 1.05, oneRM * 0.8);
            newReps = latestLog[16] < 6 ? 10 : 8;
            newSets = latestLog[16] > 7 ? 3 : 4;
          } else {
            newWeight = 15;
            newReps = 10;
            newSets = 3;
          }

          newReps = Math.max(6, Math.min(newReps, 12));
          newWeight = Math.round(newWeight * 2) / 2;
          const volume = newSets * newReps * newWeight;
          totalVolume += volume;

          dayPlan.exercises.push({
            muscleGroup: muscle,
            exercise: exercise.exercise,
            sets: newSets,
            reps: newReps,
            weight: newWeight,
            volume,
            image: exercise.image,
          });
          exerciseCount++;
        }
      }

      // Add Push-Ups and Pull-Ups
      ["Push-Ups", "Pull-Ups"].forEach((mandatory) => {
        const exercise = availableExercises.find(
          (ex) => ex.exercise === mandatory
        ) || {
          muscleGroup: mandatory === "Push-Ups" ? "Chest" : "Back",
          exercise: mandatory,
          difficultyLevel: 1,
          equipmentRequired: "None",
          targetIntensity: 0,
          exerciseDuration: 2,
          recoveryTime: 60,
          caloriesBurned: 5,
          injuryRiskLevel: 1,
          image: "/default-exercise.jpg",
        };
        const pastLogs = combinedLogs.filter((log) => log[2] === mandatory);
        const latestLog = pastLogs.slice(-1)[0];

        let newWeight, newReps, newSets;
        if (latestLog) {
          const input = [
            latestLog[14],
            0,
            exercise.difficultyLevel,
            exercise.targetIntensity,
            exercise.exerciseDuration,
            exercise.recoveryTime,
            exercise.caloriesBurned,
            exercise.injuryRiskLevel,
          ];
          const prediction = predictOptimalWorkout(model, [input])[0][0];
          newWeight = 0;
          newReps = Math.min(Math.round(prediction / 2), 20);
          newSets = latestLog[16] > 7 ? 3 : 4;
        } else {
          newWeight = 0;
          newReps = 15;
          newSets = 3;
        }

        const volume = newSets * newReps * 1;
        totalVolume += volume;
        dayPlan.exercises.push({
          muscleGroup: exercise.muscleGroup,
          exercise: mandatory,
          sets: newSets,
          reps: newReps,
          weight: newWeight,
          volume,
          image: exercise.image,
        });
      });

      if (dayPlan.exercises.length) plan.push(dayPlan);
    }

    // Step 2: Adjust weights to match targetVolume
    const currentVolume = totalVolume;
    const volumeAdjustmentFactor = targetVolume / currentVolume || 1;
    totalVolume = 0;

    plan.forEach((dayPlan) => {
      dayPlan.exercises.forEach((exercise) => {
        if (exercise.weight > 0) {
          // Skip bodyweight exercises
          exercise.weight =
            Math.round(exercise.weight * volumeAdjustmentFactor * 2) / 2;
          exercise.volume = exercise.sets * exercise.reps * exercise.weight;
        }
        totalVolume += exercise.volume;
      });
    });

    const analysis = {
      totalVolume,
      averageVolumePerDay: Math.round(totalVolume / daysPerWeek),
      recoveryRecommendation:
        totalVolume > 18000 ? "Add a rest day" : "Balanced",
      historical: historicalAnalysis,
    };

    setWeeklyPlan(plan);
    setAnalysis(analysis);
    setLoading(false);
  };

  const equipmentOptions = [
    ...new Set(exercises.map((ex) => ex.equipmentRequired).filter(Boolean)),
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom align="center">
        Smart Workout Planner
      </Typography>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Days/Week</InputLabel>
            <Select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
              label="Days/Week"
            >
              {[6].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Equipment</InputLabel>
            <Select
              multiple
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              label="Equipment"
              renderValue={(selected) => selected.join(", ")}
            >
              {equipmentOptions.map((equip) => (
                <MenuItem key={equip} value={equip}>
                  {equip}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Target Total Volume (kg)"
            type="number"
            value={targetVolume}
            onChange={(e) =>
              setTargetVolume(Math.max(0, parseInt(e.target.value) || 0))
            }
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={generateWeeklyPlan}
            disabled={loading || targetVolume <= 0}
          >
            {loading ? <CircularProgress size={24} /> : "Generate Plan"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => onNavigate("dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>

        {analysis && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Workout Analysis</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography>Total Volume: {analysis.totalVolume} kg</Typography>
            <Typography>
              Avg Volume/Day: {analysis.averageVolumePerDay} kg
            </Typography>
            <Typography>Recovery: {analysis.recoveryRecommendation}</Typography>
            <Typography>
              Total Workouts: {analysis.historical.totalWorkouts}
            </Typography>
            <Typography>
              Avg Intensity: {analysis.historical.averageIntensity.toFixed(2)}
            </Typography>
            <Typography>
              Frequent Muscle: {analysis.historical.mostFrequentMuscleGroup}
            </Typography>
          </Box>
        )}

        {weeklyPlan && (
          <Grid container spacing={2}>
            {weeklyPlan.map((dayPlan, index) => (
              <Grid item xs={12} key={index}>
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {dayPlan.day}
                    </Typography>
                    <Grid container spacing={2}>
                      {dayPlan.exercises.map((item, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                          <Card elevation={2}>
                            <CardMedia
                              component="img"
                              height="140"
                              image={item.image || "/default-exercise.jpg"}
                              alt={item.exercise}
                            />
                            <CardContent>
                              <Typography variant="h6">
                                {item.exercise}
                              </Typography>
                              <Typography>
                                Muscle: {item.muscleGroup}
                              </Typography>
                              <Typography>Sets: {item.sets}</Typography>
                              <Typography>Reps: {item.reps}</Typography>
                              <Typography>Weight: {item.weight} kg</Typography>
                              <Typography>Volume: {item.volume} kg</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default SmartWorkoutPlanner;
