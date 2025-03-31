export const generateInsights = (logs) => {
  if (!logs || logs.length === 0) return [];

  const fatigueThreshold = 70;
  const progressionThreshold = 10;

  const insights = logs.reduce((acc, log) => {
    const [date, muscleGroup, exercise, reps, weight, rating] = log;
    const fatigue = parseFloat(rating) || 0;
    const volume = (parseFloat(reps) || 0) * (parseFloat(weight) || 0);

    if (fatigue > fatigueThreshold) {
      acc.push({
        type: "warning",
        message: `High fatigue detected for ${exercise} on ${date}. Consider reducing intensity.`,
      });
    }

    if (volume > progressionThreshold) {
      acc.push({
        type: "success",
        message: `Great progress on ${exercise} with a high volume of ${volume} on ${date}.`,
      });
    }

    return acc;
  }, []);

  return insights;
};
