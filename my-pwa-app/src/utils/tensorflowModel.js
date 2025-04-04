import * as tf from "@tensorflow/tfjs";

export const prepareData = (logs) => {
  const inputs = [];
  const labels = [];

  logs.forEach((log) => {
    const [date, muscleGroup, exercise, reps, weight, rating] = log;
    if (reps && weight && rating) {
      inputs.push([parseFloat(reps), parseFloat(weight)]);
      labels.push([parseFloat(rating)]);
    }
  });

  if (inputs.length === 0 || labels.length === 0) {
    throw new Error("No valid data available for training.");
  }

  const inputTensor = tf.tensor2d(inputs);
  const labelTensor = tf.tensor2d(labels);

  return { inputTensor, labelTensor };
};

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
        parseFloat(difficultyLevel || 1),
        parseFloat(targetIntensity || 0),
        parseFloat(exerciseDuration || 2),
        parseFloat(recoveryTime || 60),
        parseFloat(caloriesBurned || 5),
        parseFloat(injuryRiskLevel || 1),
      ]);
      labels.push([parseFloat(weight) * 1.05]);
    }
  });

  if (inputs.length === 0 || labels.length === 0) {
    throw new Error("No valid data available for training.");
  }

  const inputTensor = tf.tensor2d(inputs);
  const labelTensor = tf.tensor2d(labels);

  return { inputTensor, labelTensor };
};

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

  console.log("Starting basic model training...");
  await model.fit(inputTensor, labelTensor, {
    epochs: 50,
    batchSize: 16,
    shuffle: true,
  });
  console.log("Basic model training completed.");

  return model;
};

export const trainEnhancedModel = async (inputTensor, labelTensor) => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [8], units: 64, activation: "relu" })
  );
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "linear" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });

  console.log("Starting enhanced model training...");
  await model.fit(inputTensor, labelTensor, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    validationSplit: 0.2,
  });
  console.log("Enhanced model training completed.");

  return model;
};

export const predictFatigue = (model, inputs) => {
  const inputTensor = tf.tensor2d(inputs);
  const predictions = model.predict(inputTensor);
  const predictionArray = predictions.arraySync();
  tf.dispose([inputTensor, predictions]);
  return predictionArray;
};

export const predictOptimalWorkout = (model, inputs) => {
  const inputTensor = tf.tensor2d(inputs);
  const predictions = model.predict(inputTensor);
  const predictionArray = predictions.arraySync();
  tf.dispose([inputTensor, predictions]);
  return predictionArray;
};

export const analyzeHistoricalData = (logs) => {
  const analysis = {
    totalWorkouts: logs.length,
    averageIntensity: 0,
    averageCaloriesBurned: 0,
    averageRPE: 0,
    mostFrequentMuscleGroup: "",
    totalVolume: 0,
  };

  const muscleGroupCount = {};
  let totalIntensity = 0;
  let totalCalories = 0;
  let totalRPE = 0;
  let totalVolume = 0;

  logs.forEach((log) => {
    const [
      ,
      muscleGroup,
      ,
      ,
      ,
      targetIntensity,
      ,
      ,
      ,
      ,
      ,
      caloriesBurned,
      ,
      ,
      reps,
      weight,
      rating,
    ] = log;

    totalIntensity += parseFloat(targetIntensity || 0);
    totalCalories += parseFloat(caloriesBurned || 0);
    totalRPE += parseFloat(rating || 7);
    totalVolume += parseFloat(reps || 0) * parseFloat(weight || 0);

    if (muscleGroup) {
      muscleGroupCount[muscleGroup] = (muscleGroupCount[muscleGroup] || 0) + 1;
    }
  });

  analysis.averageIntensity = totalIntensity / logs.length || 0;
  analysis.averageCaloriesBurned = totalCalories / logs.length || 0;
  analysis.averageRPE = totalRPE / logs.length || 0;
  analysis.totalVolume = totalVolume;
  analysis.mostFrequentMuscleGroup = Object.keys(muscleGroupCount).reduce(
    (a, b) => (muscleGroupCount[a] > muscleGroupCount[b] ? a : b),
    ""
  );

  return analysis;
};
