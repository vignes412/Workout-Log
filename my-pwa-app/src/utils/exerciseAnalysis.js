import * as tf from "@tensorflow/tfjs";

/**
 * Prepares exercise data for analysis.
 * @param {Array} exercises - Array of exercise data.
 * @returns {Array} - Processed exercise data.
 */
export const prepareExerciseData = (exercises) => {
  return exercises.map((exercise) => ({
    muscleGroup: exercise[0],
    exercise: exercise[1],
    difficultyLevel: parseFloat(exercise[2]) || 0,
    equipmentRequired: exercise[3],
    targetIntensity: parseFloat(exercise[4]) || 0,
    primaryMuscleGroup: exercise[5],
    secondaryMuscleGroup: exercise[6],
    exerciseDuration: parseFloat(exercise[7]) || 0,
    recoveryTime: parseFloat(exercise[8]) || 0,
    exerciseType: exercise[9],
    caloriesBurned: parseFloat(exercise[10]) || 0,
    exerciseProgression: exercise[11],
    injuryRiskLevel: parseFloat(exercise[12]) || 0,
    exerciseLink: exercise[13],
    imageLink: exercise[14],
  }));
};

/**
 * Analyzes workout logs and exercise data to generate insights.
 * @param {Array} workoutLogs - Array of workout logs.
 * @param {Array} exercises - Array of exercise data.
 * @returns {Object} - Analysis results.
 */
export const analyzeWorkoutAndExercises = (workoutLogs, exercises) => {
  const exerciseData = prepareExerciseData(exercises);

  const analysis = {
    totalWorkouts: workoutLogs.length,
    averageCaloriesBurned: 0,
    mostFrequentExercise: "",
    mostFrequentMuscleGroup: "",
    highRiskExercises: [],
  };

  const exerciseCount = {};
  const muscleGroupCount = {};
  let totalCalories = 0;

  workoutLogs.forEach((log) => {
    const [, muscleGroup, exercise, , , caloriesBurned] = log;
    totalCalories += parseFloat(caloriesBurned || 0);

    if (exercise) {
      exerciseCount[exercise] = (exerciseCount[exercise] || 0) + 1;
    }

    if (muscleGroup) {
      muscleGroupCount[muscleGroup] = (muscleGroupCount[muscleGroup] || 0) + 1;
    }
  });

  analysis.averageCaloriesBurned = totalCalories / workoutLogs.length;
  analysis.mostFrequentExercise = Object.keys(exerciseCount).reduce((a, b) =>
    exerciseCount[a] > exerciseCount[b] ? a : b
  );
  analysis.mostFrequentMuscleGroup = Object.keys(muscleGroupCount).reduce(
    (a, b) => (muscleGroupCount[a] > muscleGroupCount[b] ? a : b)
  );

  analysis.highRiskExercises = exerciseData.filter(
    (exercise) => exercise.injuryRiskLevel > 7
  );

  return analysis;
};

/**
 * Generates AI-based recommendations for workout improvement.
 * @param {Array} workoutLogs - Array of workout logs.
 * @param {Array} exercises - Array of exercise data.
 * @returns {Array} - Recommendations.
 */
export const generateRecommendations = (workoutLogs, exercises) => {
  const exerciseData = prepareExerciseData(exercises);

  return workoutLogs.map((log) => {
    const [, muscleGroup, exercise, reps, weight, rating] = log;
    const matchingExercise = exerciseData.find(
      (e) => e.exercise === exercise && e.muscleGroup === muscleGroup
    );

    if (!matchingExercise) {
      return {
        exercise,
        recommendation: "No data available for this exercise.",
      };
    }

    const recommendedWeight = weight * 1.05; // 5% increase for progression
    const recommendedReps = reps + 1; // Increment reps for progression

    return {
      exercise,
      muscleGroup,
      recommendedWeight: Math.round(recommendedWeight * 10) / 10,
      recommendedReps,
      injuryRiskLevel: matchingExercise.injuryRiskLevel,
      caloriesBurned: matchingExercise.caloriesBurned,
    };
  });
};
