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
} from "@mui/material";
import { syncData } from "../utils/sheetsApi";
import { computeDailyMetrics } from "../utils/computeDailyMetrics";

const SmartWorkoutPlanner = ({ accessToken, onNavigate }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch workout logs and exercises
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch workout logs
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
            RPE: parseFloat(row[5]) || 7, // RPE as rating
          })
        );

        // Fetch exercise list
        await syncData(
          "Exercises!A2:O", // Include image_link column
          "/api/exercises",
          setExercises,
          (row) => ({
            muscleGroup: row[0],
            exercise: row[1],
            image: row[14], // Extract image_link
          })
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (accessToken) fetchData();
  }, [accessToken]);

  // Calculate 1RM using Epley formula
  const calculate1RM = (weight, reps) => weight * (1 + reps / 30);

  // Prepare data and calculate fatigue from WorkoutSummaryTable logic
  const prepareData = () => {
    const dailyMetrics = computeDailyMetrics(workoutLogs); // Use existing utility
    const muscleGroups = [
      ...new Set(workoutLogs.map((log) => log.muscleGroup)),
    ];
    const groupedByExercise = workoutLogs.reduce((acc, log) => {
      const key = `${log.muscleGroup}_${log.exercise}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    // Calculate fatigue per muscle group (average from dailyMetrics)
    const fatigueByMuscle = dailyMetrics.reduce((acc, metric) => {
      acc[metric.muscleGroup] = acc[metric.muscleGroup] || {
        totalFatigue: 0,
        count: 0,
      };
      acc[metric.muscleGroup].totalFatigue += parseFloat(metric.fatigue);
      acc[metric.muscleGroup].count += 1;
      return acc;
    }, {});

    const avgFatigue = Object.keys(fatigueByMuscle).reduce((acc, muscle) => {
      acc[muscle] =
        fatigueByMuscle[muscle].totalFatigue / fatigueByMuscle[muscle].count;
      return acc;
    }, {});

    // Last workout date per muscle for rest calculation
    const lastWorkoutDates = muscleGroups.reduce((acc, muscle) => {
      const lastLog = workoutLogs
        .filter((log) => log.muscleGroup === muscle)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      acc[muscle] = lastLog ? new Date(lastLog.date) : null;
      return acc;
    }, {});

    return { muscleGroups, groupedByExercise, avgFatigue, lastWorkoutDates };
  };

  // Train model to predict next weight
  const trainModel = async (data) => {
    // Refine model for better accuracy
    const xs = tf.tensor2d(
      data.map((d) => [d.reps, d.weight, d.RPE]),
      [data.length, 3]
    );
    const ys = tf.tensor2d(
      data.map((d) => [Math.min(d.weight * 1.05, d.weight + 2.5)]), // 5% or +2.5kg
      [data.length, 1]
    );
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 16, inputShape: [3], activation: "relu" })
    );
    model.add(tf.layers.dense({ units: 8, activation: "relu" }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({ optimizer: "adam", loss: "meanSquaredError" });
    await model.fit(xs, ys, { epochs: 100, verbose: 0 });
    return model;
  };

  // Generate a valid, progressive weekly plan
  const generateWeeklyPlan = async () => {
    if (workoutLogs.length === 0) {
      setWeeklyPlan([
        {
          day: "Day 1",
          message: "No logs yet. Starting with beginner plan.",
          exercises: [
            {
              muscleGroup: "Chest",
              exercise: "Bench Press",
              sets: 3,
              reps: 10,
              weight: 20,
            },
            {
              muscleGroup: "Back",
              exercise: "Lat Pulldown",
              sets: 3,
              reps: 10,
              weight: 20,
            },
          ],
        },
      ]);
      return;
    }

    setLoading(true);
    const { muscleGroups, groupedByExercise, avgFatigue, lastWorkoutDates } =
      prepareData();
    const today = new Date();
    const workoutsPerWeek = 5; // Increase to 5 days for better progression
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    let totalVolume = 0;

    const plan = [];
    const majorGroups = ["Chest", "Back", "Legs", "Shoulders", "Arms"];
    muscleGroups.push(...majorGroups.filter((g) => !muscleGroups.includes(g)));

    for (let i = 0; i < workoutsPerWeek; i++) {
      const dayPlan = { day: days[i], exercises: [] };
      const musclesForDay = muscleGroups.slice(
        (i * muscleGroups.length) / workoutsPerWeek,
        ((i + 1) * muscleGroups.length) / workoutsPerWeek
      );

      for (const muscle of musclesForDay) {
        const availableExercises = exercises.filter(
          (e) => e.muscleGroup === muscle
        );
        const pastExercises = Object.keys(groupedByExercise)
          .filter((key) => key.startsWith(muscle))
          .map((key) => ({
            exercise: key.split("_")[1],
            logs: groupedByExercise[key],
          }));

        const numExercises = Math.min(
          2,
          pastExercises.length || availableExercises.length
        );
        const selectedExercises = pastExercises.length
          ? pastExercises.slice(0, numExercises)
          : availableExercises.slice(0, numExercises);

        for (const { exercise, logs } of selectedExercises) {
          const latestLog = logs ? logs[logs.length - 1] : null;
          const pastData = logs ? logs.slice(-5) : [];
          const fatigue = avgFatigue[muscle] || 0;
          const daysSinceLast = lastWorkoutDates[muscle]
            ? Math.floor(
                (today - lastWorkoutDates[muscle]) / (1000 * 60 * 60 * 24)
              )
            : Infinity;

          let newWeight, newReps, newSets;
          if (pastData.length > 0) {
            const oneRM = calculate1RM(latestLog.weight, latestLog.reps);
            const model = await trainModel(pastData);
            const inputTensor = tf.tensor2d([
              [latestLog.reps, latestLog.weight, latestLog.RPE],
            ]);
            const predictedWeight = model.predict(inputTensor).dataSync()[0];
            tf.dispose([inputTensor, model]);

            newWeight = Math.min(predictedWeight * 1.1, oneRM * 0.85); // Cap at 85% 1RM
            newReps =
              latestLog.RPE < 6 ? latestLog.reps + 2 : latestLog.reps + 1;
            newSets = fatigue > 50 || daysSinceLast < 2 ? 3 : 4;
          } else {
            newWeight = 25; // Default for new exercises
            newReps = 12;
            newSets = 4;
          }

          const fatigueFactor = fatigue > 75 ? 0.8 : 1.0;
          newWeight = Math.round(newWeight * fatigueFactor);
          newReps = Math.max(6, Math.min(newReps, 15));

          const volume = newSets * newReps * newWeight;
          totalVolume += volume;

          dayPlan.exercises.push({
            muscleGroup: muscle,
            exercise: exercise || availableExercises[0]?.exercise || "Unknown",
            sets: newSets,
            reps: newReps,
            weight: newWeight,
            volume,
          });
        }
      }
      if (dayPlan.exercises.length > 0) plan.push(dayPlan);
    }

    const analysis = {
      totalVolume,
      averageVolumePerDay: Math.round(totalVolume / workoutsPerWeek),
      recoveryRecommendation:
        totalVolume > 25000
          ? "Consider adding an extra rest day for recovery."
          : "Recovery plan looks balanced.",
    };

    setWeeklyPlan({ plan, analysis });
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom align="center">
        Smart Workout Planner
      </Typography>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateWeeklyPlan}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Generate Weekly Plan"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => onNavigate("dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
        {weeklyPlan && weeklyPlan.analysis && (
          <>
            <Typography variant="h6" gutterBottom>
              Weekly Plan Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography>
              Total Volume: {weeklyPlan.analysis.totalVolume} kg
            </Typography>
            <Typography>
              Average Volume Per Day: {weeklyPlan.analysis.averageVolumePerDay}{" "}
              kg
            </Typography>
            <Typography>
              {weeklyPlan.analysis.recoveryRecommendation}
            </Typography>
          </>
        )}

        {weeklyPlan && weeklyPlan.plan && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {weeklyPlan.plan.map((dayPlan, index) => (
              <Grid item xs={12} key={index}>
                <Card elevation={3} sx={{ borderRadius: 2, mb: 2 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {dayPlan.day}
                    </Typography>
                    <Grid container spacing={2}>
                      {dayPlan.exercises.map((item, i) => {
                        const exerciseData = exercises.find(
                          (e) => e.exercise === item.exercise
                        );
                        const image =
                          exerciseData?.image || "/default-exercise.jpg"; // Use image_link or fallback

                        return (
                          <Grid item xs={12} sm={6} md={4} key={i}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                              <CardMedia
                                component="img"
                                height="140"
                                image={image}
                                alt={item.exercise}
                              />
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {item.exercise}
                                </Typography>
                                <Typography>
                                  Muscle: {item.muscleGroup}
                                </Typography>
                                <Typography>Sets: {item.sets}</Typography>
                                <Typography>Reps: {item.reps}</Typography>
                                <Typography>
                                  Weight: {item.weight} kg
                                </Typography>
                                <Typography>
                                  Volume: {item.volume} kg
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
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
