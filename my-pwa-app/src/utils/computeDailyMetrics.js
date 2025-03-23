export const computeDailyMetrics = (logs) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

  const grouped = {};
  logs.forEach((log) => {
    const key = `${log[0]}_${log[1]}_${log[2]}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  const sortedGroups = Object.entries(grouped)
    .map(([key, sessionLogs], index) => {
      const [date, muscleGroup, exercise] = key.split("_");
      const totalVolume = sessionLogs
        .reduce(
          (sum, log) =>
            sum +
            (isNaN(parseFloat(log[3])) ? 0 : parseFloat(log[3])) *
              (isNaN(parseFloat(log[4])) ? 0 : parseFloat(log[4])),
          0
        )
        .toFixed(2);
      const totalSets = sessionLogs.length;
      const totalReps = sessionLogs
        .reduce(
          (sum, log) =>
            sum + (isNaN(parseFloat(log[3])) ? 0 : parseFloat(log[3])),
          0
        )
        .toFixed(2);
      const averageReps = totalSets
        ? (totalReps / totalSets).toFixed(2)
        : "0.00";
      const averageWeight = totalSets
        ? (
            sessionLogs.reduce(
              (sum, log) =>
                sum + (isNaN(parseFloat(log[4])) ? 0 : parseFloat(log[4])),
              0
            ) / totalSets
          ).toFixed(2)
        : "0.00";
      const averageFatigue = totalSets
        ? (
            sessionLogs.reduce(
              (sum, log) =>
                sum + (isNaN(parseFloat(log[5])) ? 0 : parseFloat(log[5])),
              0
            ) / totalSets
          ).toFixed(2)
        : "0.00";
      const maxWeight = Math.max(
        ...sessionLogs.map(
          (log) => (isNaN(parseFloat(log[4])) ? 0 : parseFloat(log[4])),
          0
        )
      );

      // Consolidate "How I Feel" (most frequent value)
      const feelCounts = {};
      sessionLogs.forEach((log) => {
        const feel = log[5] || "N/A";
        feelCounts[feel] = (feelCounts[feel] || 0) + 1;
      });
      const howIFeel = Object.entries(feelCounts).reduce(
        (a, b) => (b[1] > a[1] ? b : a),
        ["N/A", 0]
      )[0];

      return {
        id: index + 1,
        date: date || "",
        muscleGroup: muscleGroup || "",
        exercise: exercise || "",
        totalVolume,
        totalSets,
        totalReps,
        averageReps,
        averageWeight,
        averageFatigue,
        maxWeight,
        howIFeel, // Consolidated from logs
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Add intensity based on volume change from previous workout
  const muscleExerciseMap = {};
  sortedGroups.forEach((current, index) => {
    const key = `${current.muscleGroup}_${current.exercise}`;
    let intensity = "N/A";
    if (muscleExerciseMap[key]) {
      const prevVolume = isNaN(parseFloat(muscleExerciseMap[key].totalVolume))
        ? 0
        : parseFloat(muscleExerciseMap[key].totalVolume);
      const currentVolume = isNaN(parseFloat(current.totalVolume))
        ? 0
        : parseFloat(current.totalVolume);
      intensity = prevVolume
        ? (((currentVolume - prevVolume) / prevVolume) * 100).toFixed(2)
        : "0.00";
      const progressionRate = prevVolume
        ? (((currentVolume - prevVolume) / prevVolume) * 100).toFixed(2)
        : "N/A";
      sortedGroups[index].progressionRate = progressionRate;
    } else {
      sortedGroups[index].progressionRate = "N/A";
    }
    sortedGroups[index].intensity = intensity; // New field
    muscleExerciseMap[key] = current;
  });

  return sortedGroups;
};
