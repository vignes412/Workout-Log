// src/utils/computeDailyMetrics.ts
export type WorkoutLog = [
  date: string,
  muscleGroup: string,
  exercise: string,
  reps: string,
  weight: string,
  rating: string,
  restTime?: string
];

export interface MetricEntry {
  id: number;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: string;
  totalSets: number;
  totalReps: string;
  averageReps: string;
  averageWeight: string;
  averageFatigue: string;
  maxWeight: number;
  howIFeel: string;
  intensity: string;
  fatigue: string;
  progressionRate: string;
}

export const computeDailyMetrics = (logs: WorkoutLog[]): MetricEntry[] => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

  // Constants for intensity and fatigue calculation
  const MAX_POSSIBLE_EFFORT = 200 * 20 * 10; // 200 lbs × 20 reps × RPE 10 = 40000 (adjustable)
  const FATIGUE_FACTOR = 0.2; // Scales intensity to fatigue contribution (e.g., 50% intensity → 5% fatigue)

  // Group logs by date, muscle group, and exercise
  const grouped: Record<string, WorkoutLog[]> = {};
  logs.forEach((log) => {
    const key = `${log[0]}_${log[1]}_${log[2]}`; // date_muscleGroup_exercise
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  // Process each group into initial metrics
  const sortedGroups = Object.entries(grouped)
    .map(([key, sessionLogs], index) => {
      const [date, muscleGroup, exercise] = key.split("_");

      // Parse log data
      const totalVolume = sessionLogs
        .reduce((sum, log) => sum + parseReps(log[3]) * parseWeight(log[4]), 0)
        .toFixed(2);
      const totalSets = sessionLogs.length;
      const totalReps = sessionLogs
        .reduce((sum, log) => sum + parseReps(log[3]), 0)
        .toFixed(2);
      const averageReps = totalSets
        ? (parseFloat(totalReps) / totalSets).toFixed(2)
        : "0.00";
      const averageWeight = totalSets
        ? (
            sessionLogs.reduce((sum, log) => sum + parseWeight(log[4]), 0) /
            totalSets
          ).toFixed(2)
        : "0.00";
      const averageFatigue = totalSets
        ? (
            sessionLogs.reduce((sum, log) => sum + parseRating(log[5]), 0) /
            totalSets
          ).toFixed(2)
        : "0.00";
      const maxWeight = Math.max(
        ...sessionLogs.map((log) => parseWeight(log[4]))
      );

      // Consolidate "How I Feel"
      const feelCounts: Record<string, number> = sessionLogs.reduce((counts, log) => {
        const feel = log[5] || "N/A";
        counts[feel] = (counts[feel] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      const howIFeel = Object.entries(feelCounts).reduce(
        (max, current) => (current[1] > max[1] ? current : max),
        ["N/A", 0]
      )[0];

      // Calculate intensity as percentage: (Weight × Reps × Rating) / Max Effort × 100
      const totalIntensity = sessionLogs
        .reduce((sum, log) => {
          const reps = parseReps(log[3]);
          const weight = parseWeight(log[4]);
          const rating = parseRating(log[5]);
          const effort = weight * reps * rating;
          return sum + (effort / MAX_POSSIBLE_EFFORT) * 100;
        }, 0)
        .toFixed(2);

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
        howIFeel,
        intensity: totalIntensity, // Intensity as percentage
        fatigue: "0", // Placeholder, will be updated below
        progressionRate: "N/A", // Will be updated in the next step
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

  // Calculate cumulative daily fatigue
  const dailyFatigueMap: Record<string, string> = {};
  sortedGroups.forEach((entry) => {
    const date = entry.date;
    if (!dailyFatigueMap[date]) dailyFatigueMap[date] = "0";
    const fatigueContribution = (
      parseFloat(entry.intensity) * FATIGUE_FACTOR
    ).toFixed(2);
    dailyFatigueMap[date] = (
      parseFloat(dailyFatigueMap[date]) + parseFloat(fatigueContribution)
    ).toFixed(2);
    entry.fatigue = dailyFatigueMap[date]; // Cumulative fatigue up to this exercise
  });

  // Update the progression rate calculation logic to group by muscle group and exercise
  const muscleExerciseMap: Record<string, { highestVolume: number }> = {};
  sortedGroups.forEach((current, index) => {
    const key = `${current.muscleGroup}_${current.exercise}`;
    let progressionRate = "N/A";

    if (muscleExerciseMap[key]) {
      const lastHighestVolume = parseFloat(
        muscleExerciseMap[key].highestVolume.toString()
      );
      const currentVolume = parseFloat(current.totalVolume);
      progressionRate = lastHighestVolume
        ? (
            ((currentVolume - lastHighestVolume) / lastHighestVolume) *
            100
          ).toFixed(2)
        : "0.00";

      // Update the highest volume if the current volume is greater
      if (currentVolume > lastHighestVolume) {
        muscleExerciseMap[key].highestVolume = currentVolume;
      }
    } else {
      // Initialize the highest volume for this muscle group and exercise
      muscleExerciseMap[key] = {
        highestVolume: parseFloat(current.totalVolume),
      };
    }

    sortedGroups[index].progressionRate = progressionRate;
  });

  return sortedGroups;
};

// Helper functions for parsing with defaults
const parseReps = (value: string | number | null | undefined): number => 
  (isNaN(parseFloat(String(value))) ? 0 : parseFloat(String(value)));

const parseWeight = (value: string | number | null | undefined): number => 
  (isNaN(parseFloat(String(value))) ? 0 : parseFloat(String(value)));

const parseRating = (value: string | number | null | undefined): number => 
  (isNaN(parseFloat(String(value))) || value === null || value === undefined)
    ? 7
    : Math.min(Math.max(parseFloat(String(value)), 1), 10); // Default to 7, clamp 1-10