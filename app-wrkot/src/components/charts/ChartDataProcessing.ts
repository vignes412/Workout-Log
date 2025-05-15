import { WorkoutLogEntry } from '@/types/Workout_Log';
import { parseISO, isValid, format, subDays, isWithinInterval } from 'date-fns';

// --- Data Processing Functions ---

export const processVolumeOverTimeData = (logs: WorkoutLogEntry[]) => {
  if (!logs || logs.length === 0) return [];
  const dailyVolume: { [date: string]: number } = {};

  logs.forEach(log => {
    const parsedDate = parseISO(log.date);
    if (!isValid(parsedDate)) return;
    const date = format(parsedDate, 'yyyy-MM-dd');
    const volume = (log.weight || 0) * (log.reps || 0);
    dailyVolume[date] = (dailyVolume[date] || 0) + volume;
  });

  return Object.entries(dailyVolume)
    .map(([date, totalVolume]) => ({ date, totalVolume }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const processVolumeByMuscleGroupData = (logs: WorkoutLogEntry[]) => {
  if (!logs || logs.length === 0) return [];
  const muscleGroupVolume: { [muscleGroup: string]: number } = {};

  logs.forEach(log => {
    const group = log.muscleGroup || 'Unknown';
    const volume = (log.weight || 0) * (log.reps || 0);
    muscleGroupVolume[group] = (muscleGroupVolume[group] || 0) + volume;
  });

  return Object.entries(muscleGroupVolume)
    .map(([muscleGroup, totalVolume]) => ({ muscleGroup, totalVolume }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
};

export const processMuscleGroupVolumeDistributionData = (logs: WorkoutLogEntry[]) => {
  if (!logs || logs.length === 0) return [];
  const muscleGroupVolume: { [muscleGroup: string]: number } = {};
  let totalVolumeOverall = 0;

  logs.forEach(log => {
    const group = log.muscleGroup || 'Unknown';
    const volume = (log.weight || 0) * (log.reps || 0);
    muscleGroupVolume[group] = (muscleGroupVolume[group] || 0) + volume;
    totalVolumeOverall += volume;
  });

  if (totalVolumeOverall === 0) {
    return Object.keys(muscleGroupVolume).map(group => ({
      subject: group,
      value: 0,
      fullMark: 100,
    }));
  }

  return Object.entries(muscleGroupVolume)
    .map(([muscleGroup, volume]) => ({
      subject: muscleGroup,
      value: parseFloat(((volume / totalVolumeOverall) * 100).toFixed(2)),
      fullMark: 100,
    }))
    .sort((a, b) => b.value - a.value);
};

export const processRelativeDailyVolumeData = (logs: WorkoutLogEntry[]) => {
  if (!logs || logs.length === 0) return [];
  const dailyVolumeMap: { [date: string]: number } = {};

  logs.forEach(log => {
    const parsedDate = parseISO(log.date);
    if (!isValid(parsedDate)) return;
    const date = format(parsedDate, 'yyyy-MM-dd');
    const volume = (log.weight || 0) * (log.reps || 0);
    dailyVolumeMap[date] = (dailyVolumeMap[date] || 0) + volume;
  });

  const dailyVolumes = Object.entries(dailyVolumeMap).map(([date, totalVolume]) => ({ date, totalVolume }));
  if (dailyVolumes.length === 0) return [];

  const maxVolume = Math.max(...dailyVolumes.map(dv => dv.totalVolume), 0);

  if (maxVolume === 0) {
    return dailyVolumes.map(dv => ({ ...dv, relativeVolume: 0 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return dailyVolumes
    .map(({ date, totalVolume }) => ({
      date,
      relativeVolume: parseFloat(((totalVolume / maxVolume) * 100).toFixed(2)),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const processRecentFatigueByMuscleGroupData = (logs: WorkoutLogEntry[], daysAgo: number = 7) => {
  if (!logs || logs.length === 0) return [];

  const overallDailyVolumeMap: { [date: string]: number } = {};
  logs.forEach(log => {
    const parsedDate = parseISO(log.date);
    if (!isValid(parsedDate)) return;
    const date = format(parsedDate, 'yyyy-MM-dd');
    const volume = (log.weight || 0) * (log.reps || 0);
    overallDailyVolumeMap[date] = (overallDailyVolumeMap[date] || 0) + volume;
  });
  const maxOverallDailyVolume = Math.max(...Object.values(overallDailyVolumeMap), 0);

  if (maxOverallDailyVolume === 0) {
     const muscleGroups = [...new Set(logs.map(log => log.muscleGroup || 'Unknown'))];
     return muscleGroups.map(group => ({ muscleGroup: group, fatiguePercent: 0 }));
  }

  const endDate = new Date();
  const startDate = subDays(endDate, daysAgo);

  const recentLogs = logs.filter(log => {
    const parsedDate = parseISO(log.date);
    return isValid(parsedDate) && isWithinInterval(parsedDate, { start: startDate, end: endDate });
  });

  const muscleGroupRecentVolume: { [muscleGroup: string]: number } = {};
  recentLogs.forEach(log => {
    const group = log.muscleGroup || 'Unknown';
    const volume = (log.weight || 0) * (log.reps || 0);
    muscleGroupRecentVolume[group] = (muscleGroupRecentVolume[group] || 0) + volume;
  });

  const muscleGroups = [...new Set(logs.map(log => log.muscleGroup || 'Unknown'))];

  return muscleGroups
    .map(group => {
      const recentVolume = muscleGroupRecentVolume[group] || 0;
      const fatiguePercent = parseFloat(((recentVolume / maxOverallDailyVolume) * 100).toFixed(2));
      return {
        muscleGroup: group,
        fatiguePercent: Math.min(fatiguePercent, 200),
      };
    })
    .sort((a, b) => b.fatiguePercent - a.fatiguePercent);
};

export const processProgressionAndFatigueData = (logs: WorkoutLogEntry[]) => {
  if (!logs || logs.length === 0) return [];

  const dailyVolumeMap: { [date: string]: number } = {};
  logs.forEach(log => {
    const parsedDate = parseISO(log.date);
    if (!isValid(parsedDate)) return;
    const date = format(parsedDate, 'yyyy-MM-dd');
    const volume = (log.weight || 0) * (log.reps || 0);
    dailyVolumeMap[date] = (dailyVolumeMap[date] || 0) + volume;
  });

  const sortedDailyVolumes = Object.entries(dailyVolumeMap)
    .map(([date, totalVolume]) => ({ date, totalVolume }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedDailyVolumes.length === 0) return [];

  const maxOverallDailyVolume = Math.max(...sortedDailyVolumes.map(dv => dv.totalVolume), 0);

  return sortedDailyVolumes.map((currentDay, index) => {
    const fatiguePercent = maxOverallDailyVolume > 0
      ? parseFloat(((currentDay.totalVolume / maxOverallDailyVolume) * 100).toFixed(2))
      : 0;

    let progressionPercent = 0;
    if (index > 0) {
      const previousDay = sortedDailyVolumes[index - 1];
      if (previousDay.totalVolume > 0) {
        progressionPercent = parseFloat((((currentDay.totalVolume - previousDay.totalVolume) / previousDay.totalVolume) * 100).toFixed(2));
      } else if (currentDay.totalVolume > 0) {
        progressionPercent = 100; 
      }
    } else if (sortedDailyVolumes.length === 1 && currentDay.totalVolume > 0) {
      progressionPercent = 0;
    }
    return {
      date: currentDay.date,
      fatigue: fatiguePercent,
      progression: progressionPercent,
    };
  });
};
