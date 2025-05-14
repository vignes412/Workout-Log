// src/utils/computeDailyMetrics.ts
import { WorkoutLogEntry } from '@/types/Workout_Log';

// Define an interface for the metric object
interface ComputedMetric {
  id: number;
  date: string;
  muscleGroup: string;
  exercise: string;
  totalVolume: string; // Kept as string due to .toFixed()
  totalSets: number;
  totalReps: string; // Kept as string due to .toFixed()
  averageReps: string;
  averageWeight: string;
  averageFatigue: string;
  maxWeight: number;
  howIFeel: string;
  intensity: string; // Kept as string due to .toFixed()
  fatigue: string; // Kept as string due to .toFixed()
  progressionRate?: string; // Optional as it's added later
}

/**
 * Computes daily workout metrics by grouping log entries by date, muscle group, and exercise
 * @param logs Array of workout log data in format [date, muscleGroup, exercise, reps, weight, rating, ?restTime]
 * @returns Array of aggregated daily metrics
 */
export const computeDailyMetrics = (logs: any[]): ComputedMetric[] => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) return [];

  // Constants for intensity and fatigue calculation
  const MAX_POSSIBLE_EFFORT = 200 * 20 * 10; // 200 lbs × 20 reps × RPE 10 = 40000 (adjustable)
  const FATIGUE_FACTOR = 0.2; // Scales intensity to fatigue contribution (e.g., 50% intensity → 10% fatigue)

  // Group logs by date, muscle group, and exercise
  const grouped: { [key: string]: any[] } = {};
  logs.forEach((log) => {
    // log format: [date, muscleGroup, exercise, reps, weight, rating, ?restTime]
    const logDateStr = log[0] ? (typeof log[0] === 'string' ? log[0] : new Date(log[0]).toISOString().split('T')[0]) : 'UnknownDate';
    const key = `${logDateStr}_${log[1]}_${log[2]}`; // date_muscleGroup_exercise
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  });

  // Process each group into initial metrics
  const sortedGroups: ComputedMetric[] = Object.entries(grouped)
    .map(([key, sessionLogs], index) => {
      const [date, muscleGroup, exercise] = key.split("_");

      // Parse log data 
      const totalVolume = sessionLogs
        .reduce((sum, log) => sum + parseReps(log[3]) * parseWeight(log[4]), 0)
        .toFixed(2);
      const totalSets = sessionLogs.length;
      const totalReps = sessionLogs
        .reduce((sum, log) => sum + parseReps(log[3]), 0)
        .toFixed(0); // Reps are usually whole numbers
      const averageReps = totalSets
        ? (parseFloat(totalReps) / totalSets).toFixed(1)
        : "0.0";
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
          ).toFixed(1)
        : "0.0";
      const maxWeight = Math.max(
        ...sessionLogs.map((log) => parseWeight(log[4]))
      );

      // Consolidate "How I Feel" ratings (from log[5])
      const feelCounts = sessionLogs.reduce((counts: { [key: string]: number }, log) => {
        const feel = log[5]?.toString() || "N/A";
        counts[feel] = (counts[feel] || 0) + 1;
        return counts;
      }, {});
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
      } as ComputedMetric; // Added type assertion here
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date

  // Calculate cumulative daily fatigue
  const dailyFatigueMap: { [key: string]: string } = {};
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
  const muscleExerciseMap: { [key: string]: { highestVolume: number } } = {};
  sortedGroups.forEach((current) => {
    const key = `${current.muscleGroup}_${current.exercise}`;
    let progressionRateValue = "N/A";

    if (muscleExerciseMap[key]) {
      const lastHighestVolume = parseFloat(
        muscleExerciseMap[key].highestVolume.toString()
      );
      const currentVolume = parseFloat(current.totalVolume);
      progressionRateValue = lastHighestVolume && lastHighestVolume !== 0
        ? (
            ((currentVolume - lastHighestVolume) / lastHighestVolume) *
            100
          ).toFixed(2)
        : "0.00"; 

      if (currentVolume > lastHighestVolume) {
        muscleExerciseMap[key].highestVolume = currentVolume;
      }
    } else {
      muscleExerciseMap[key] = {
        highestVolume: parseFloat(current.totalVolume),
      };
      progressionRateValue = "0.00"; 
    }
    current.progressionRate = progressionRateValue;
  });

  return sortedGroups;
};

// Helper functions for parsing with defaults
export const parseReps = (value: string | number | undefined): number => {
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
};
export const parseWeight = (value: string | number | undefined): number => {
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
};
export const parseRating = (value: string | number | undefined): number => {
  const num = parseFloat(String(value));
  return isNaN(num) || num < 1 || num > 10
    ? 7 // Default rating if invalid, null, or undefined
    : Math.min(Math.max(num, 1), 10); // Clamp between 1 and 10
};

// New functions for DashboardOverview
export const getTotalWorkouts = (logs: WorkoutLogEntry[]): number => {
  if (!logs || logs.length === 0) return 0;
  const uniqueDates = new Set(logs.map(log => {
    try {
      return new Date(log.date).toDateString();
    } catch { return null; } // Handle invalid date strings, removed unused var
  }).filter(date => date !== null));
  return uniqueDates.size;
};

export const getWeeklyAverageWorkouts = (logs: WorkoutLogEntry[]): number => {
  if (!logs || logs.length === 0) return 0;
  
  const validLogs = logs.filter(log => {
    try {
      return !isNaN(new Date(log.date).getTime());
    } catch { return false; } // Removed unused var
  });

  if (validLogs.length === 0) return 0;

  const sortedLogs = [...validLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const firstDate = new Date(sortedLogs[0].date);
  const lastDate = new Date(sortedLogs[sortedLogs.length - 1].date);
  
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  // Add 1 to diffDays to include the first day, making a single day span 1 day, not 0.
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  const weeks = Math.max(1, diffDays / 7);

  const totalWorkouts = getTotalWorkouts(validLogs); // Use validLogs here too
  return parseFloat((totalWorkouts / weeks).toFixed(1));
};

export const getTotalWeightLifted = (logs: WorkoutLogEntry[], period: 'month' | 'all' = 'month'): number => {
  if (!logs || logs.length === 0) return 0;
  
  let filteredLogs = logs.filter(log => { // Ensure logs have valid dates before filtering
    try {
      return !isNaN(new Date(log.date).getTime());
    } catch { return false; } // Removed unused var
  });

  if (period === 'month') {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    filteredLogs = filteredLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });
  }
  if (filteredLogs.length === 0) return 0;

  return parseFloat(filteredLogs.reduce((sum, log) => sum + (parseReps(log.reps) * parseWeight(log.weight)), 0).toFixed(2));
};

export const getPersonalRecordsCount = (logs: WorkoutLogEntry[]): number => {
  if (!logs || logs.length === 0) return 0;

  const prs: { [exercise: string]: number } = {};
  logs.forEach(log => {
    if (log.exercise && typeof log.exercise === 'string') { // Ensure exercise is a valid string
      const weight = parseWeight(log.weight);
      if (!prs[log.exercise] || weight > prs[log.exercise]) {
        prs[log.exercise] = weight;
      }
    }
  });
  return Object.keys(prs).length;
};

export const getNewPRsThisMonth = (logs: WorkoutLogEntry[]): number => {
  if (!logs || logs.length === 0) return 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const prs: { [exercise: string]: { weight: number, date: Date } } = {};
  
  // Sort logs by date to process them chronologically
  const sortedLogs = [...logs].filter(log => { // Filter for valid dates before sorting
    try {
      return !isNaN(new Date(log.date).getTime()) && log.exercise && typeof log.exercise === 'string';
    } catch { return false; } // Removed unused var
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedLogs.length === 0) return 0;

  const monthlyPRs: { [exercise: string]: { weight: number, date: Date } } = {};

  sortedLogs.forEach(log => {
    const weight = parseWeight(log.weight);
    const logDate = new Date(log.date);

    // Update overall PRs
    if (!prs[log.exercise] || weight > prs[log.exercise].weight) {
      prs[log.exercise] = { weight, date: logDate };
    }

    // If this log is from the current month and it's a PR (or the first log for the exercise this month)
    if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
      if (!monthlyPRs[log.exercise] || weight > monthlyPRs[log.exercise].weight) {
         monthlyPRs[log.exercise] = { weight, date: logDate };
      }
    }
  });
  
  // Count how many of the PRs recorded in monthlyPRs were actually new PRs compared to before this month
  let newPRCount = 0;
  for (const exercise in monthlyPRs) {
    const currentMonthPR = monthlyPRs[exercise];
    // Find the PR for this exercise from logs *before* the current month
    let previousMaxWeight = 0;
    sortedLogs.forEach(log => {
      if (log.exercise === exercise) {
        const logDate = new Date(log.date);
        if (logDate.getFullYear() < currentYear || (logDate.getFullYear() === currentYear && logDate.getMonth() < currentMonth)) {
          previousMaxWeight = Math.max(previousMaxWeight, parseWeight(log.weight));
        }
      }
    });

    if (currentMonthPR.weight > previousMaxWeight) {
      newPRCount++;
    }
  }
  return newPRCount;
};
