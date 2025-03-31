import * as tf from "@tensorflow/tfjs";

/**
 * Prepares the data for TensorFlow model training.
 * @param {Array} logs - Array of workout logs.
 * @returns {Object} - TensorFlow tensors for training.
 */
export const prepareData = (logs) => {
  const inputs = [];
  const labels = [];

  logs.forEach((log) => {
    const [date, muscleGroup, exercise, reps, weight, rating] = log;
    if (reps && weight && rating) {
      inputs.push([parseFloat(reps), parseFloat(weight)]); // Ensure 2D array
      labels.push([parseFloat(rating)]); // Ensure 2D array for labels
    }
  });

  if (inputs.length === 0 || labels.length === 0) {
    throw new Error("No valid data available for training.");
  }

  const inputTensor = tf.tensor2d(inputs); // 2D array for inputs
  const labelTensor = tf.tensor2d(labels); // 2D array for labels

  return { inputTensor, labelTensor };
};

/**
 * Prepares the data for TensorFlow model training with additional parameters.
 * @param {Array} logs - Array of workout logs.
 * @returns {Object} - TensorFlow tensors for training.
 */
export const prepareEnhancedData = (logs) => {
  const inputs = [];
  const labels = [];

  logs.forEach((log) => {
    const [
      date,
      muscleGroup,
      exercise,
      difficultyLevel,
      equipmentRequired,
      targetIntensity,
      primaryMuscleGroup,
      secondaryMuscleGroup,
      exerciseDuration,
      recoveryTime,
      exerciseType,
      caloriesBurned,
      exerciseProgression,
      injuryRiskLevel,
      reps,
      weight,
      rating,
    ] = log;

    if (reps && weight && rating) {
      inputs.push([
        parseFloat(reps),
        parseFloat(weight),
        parseFloat(difficultyLevel),
        parseFloat(targetIntensity),
        parseFloat(exerciseDuration),
        parseFloat(recoveryTime),
        parseFloat(caloriesBurned),
        parseFloat(injuryRiskLevel),
      ]); // Expanded input features
      labels.push([parseFloat(rating)]); // Target label
    }
  });

  if (inputs.length === 0 || labels.length === 0) {
    throw new Error("No valid data available for training.");
  }

  const inputTensor = tf.tensor2d(inputs);
  const labelTensor = tf.tensor2d(labels);

  return { inputTensor, labelTensor };
};

/**
 * Builds and trains a TensorFlow model.
 * @param {tf.Tensor} inputTensor - Input tensor.
 * @param {tf.Tensor} labelTensor - Label tensor.
 * @returns {tf.LayersModel} - Trained TensorFlow model.
 */
export const trainModel = async (inputTensor, labelTensor) => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [2], units: 16, activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "linear" }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: "meanSquaredError",
    metrics: ["mse"],
  });

  console.log("Starting model training..."); // Debugging log
  await model.fit(inputTensor, labelTensor, {
    epochs: 50,
    batchSize: 16,
    shuffle: true,
  });
  console.log("Model training completed."); // Debugging log

  return model;
};

/**
 * Builds and trains an enhanced TensorFlow model.
 * @param {tf.Tensor} inputTensor - Input tensor.
 * @param {tf.Tensor} labelTensor - Label tensor.
 * @returns {tf.LayersModel} - Trained TensorFlow model.
 */
export const trainEnhancedModel = async (inputTensor, labelTensor) => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [8], units: 32, activation: "relu" }) // Adjusted input shape
  );
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "linear" }));

  model.compile({
    optimizer: tf.train.adam(),
    loss: "meanSquaredError",
    metrics: ["mse"],
  });

  console.log("Starting enhanced model training...");
  await model.fit(inputTensor, labelTensor, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
  });
  console.log("Enhanced model training completed.");

  return model;
};

/**
 * Predicts fatigue levels using the trained model.
 * @param {tf.LayersModel} model - Trained TensorFlow model.
 * @param {Array} inputs - Array of input data for prediction.
 * @returns {Array} - Predicted fatigue levels.
 */
export const predictFatigue = (model, inputs) => {
  const inputTensor = tf.tensor2d(inputs);
  console.log("Input tensor for prediction:", inputTensor.arraySync()); // Debugging log

  const predictions = model.predict(inputTensor);
  const predictionArray = predictions.arraySync();
  console.log("Prediction results:", predictionArray); // Debugging log

  return predictionArray;
};

/**
 * Predicts optimal reps and weights for progress.
 * @param {tf.LayersModel} model - Trained TensorFlow model.
 * @param {Array} inputs - Array of input data for prediction.
 * @returns {Array} - Predicted fatigue levels.
 */
export const predictOptimalWorkout = (model, inputs) => {
  const inputTensor = tf.tensor2d(inputs);
  const predictions = model.predict(inputTensor);
  return predictions.arraySync();
};

/**
 * Analyzes historical workout data for trends and insights.
 * @param {Array} logs - Array of workout logs.
 * @returns {Object} - Analysis results.
 */
export const analyzeHistoricalData = (logs) => {
  const analysis = {
    totalWorkouts: logs.length,
    averageIntensity: 0,
    averageCaloriesBurned: 0,
    mostFrequentMuscleGroup: "",
  };

  const muscleGroupCount = {};
  let totalIntensity = 0;
  let totalCalories = 0;

  logs.forEach((log) => {
    const [, muscleGroup, , , targetIntensity, , , , , , caloriesBurned] = log;
    totalIntensity += parseFloat(targetIntensity || 0);
    totalCalories += parseFloat(caloriesBurned || 0);

    if (muscleGroup) {
      muscleGroupCount[muscleGroup] = (muscleGroupCount[muscleGroup] || 0) + 1;
    }
  });

  analysis.averageIntensity = totalIntensity / logs.length;
  analysis.averageCaloriesBurned = totalCalories / logs.length;
  analysis.mostFrequentMuscleGroup = Object.keys(muscleGroupCount).reduce(
    (a, b) => (muscleGroupCount[a] > muscleGroupCount[b] ? a : b),
    ""
  );

  return analysis;
};

/**
 * Generates a personalized workout plan based on historical data and model predictions.
 * @param {tf.LayersModel} model - Trained TensorFlow model.
 * @param {Array} logs - Array of workout logs.
 * @returns {Array} - Generated workout plan.
 */
export const generateWorkoutPlan = (model, logs) => {
  const analysis = analyzeHistoricalData(logs);
  const inputs = logs.map((log) => {
    const [
      ,
      ,
      ,
      difficultyLevel,
      ,
      targetIntensity,
      ,
      ,
      exerciseDuration,
      recoveryTime,
      ,
      ,
      ,
      injuryRiskLevel,
      reps,
      weight,
    ] = log;

    return [
      parseFloat(reps || 0),
      parseFloat(weight || 0),
      parseFloat(difficultyLevel || 0),
      parseFloat(targetIntensity || 0),
      parseFloat(exerciseDuration || 0),
      parseFloat(recoveryTime || 0),
      parseFloat(injuryRiskLevel || 0),
    ];
  });

  const predictions = predictOptimalWorkout(model, inputs);

  const workoutPlan = predictions.map((prediction, index) => ({
    exercise: logs[index][2], // Exercise name
    recommendedIntensity: prediction[0],
    muscleGroup: logs[index][1], // Muscle group
  }));

  return { analysis, workoutPlan };
};
