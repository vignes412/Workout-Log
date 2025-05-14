// Dashboard utilities for widget configuration
import { WorkoutLog } from '../../types';

/**
 * Dashboard configuration and utility functions
 */

// List of all available widgets in the dashboard
export type DashboardWidgetId =
  | 'status'
  | 'train'
  | 'rest'
  | 'streak-tracker'
  | 'workout-count'
  | 'total-volume'
  | 'workout-summary'
  | 'weekly-summary'
  | 'monthly-summary'
  | 'workout-logs'
  | 'workout-summary-table'
  | 'volume-over-time'
  | 'fatigue-by-muscle'
  | 'progression-fatigue'
  | 'progression-muscle'
  | 'muscle-distribution'
  | 'workout-features'
  | 'todo-list'
  | 'progress-goals'
  | 'achievements';

// Export all widget IDs as an array for easy iteration
export const WIDGET_IDS: DashboardWidgetId[] = [
  'status',
  'train',
  'rest',
  'streak-tracker',
  'workout-count',
  'total-volume',
  'workout-summary',
  'weekly-summary',
  'monthly-summary',
  'workout-logs',
  'workout-summary-table',
  'volume-over-time',
  'fatigue-by-muscle',
  'progression-fatigue',
  'progression-muscle',
  'muscle-distribution',
  'workout-features',
  'todo-list',
  'progress-goals',
  'achievements'
];

// Type for widget visibility state
export type DashboardVisibility = {
  [key in DashboardWidgetId]: boolean;
};

// Default visibility for all widgets
export const defaultVisibility: DashboardVisibility = {
  'status': true,
  'train': true,
  'rest': true,
  'streak-tracker': true,
  'workout-count': true,
  'total-volume': true,
  'workout-summary': true,
  'weekly-summary': true,
  'monthly-summary': true,
  'workout-logs': true,
  'workout-summary-table': true,
  'volume-over-time': true,
  'fatigue-by-muscle': true,
  'progression-fatigue': true,
  'progression-muscle': true,
  'muscle-distribution': true,
  'workout-features': true,
  'todo-list': true,
  'progress-goals': true,
  'achievements': true
};

// Widget categorization
export const widgetCategories = {
  stats: [
    'status',
    'train',
    'rest',
    'streak-tracker',
    'workout-count',
    'total-volume'
  ],
  summaries: [
    'workout-summary',
    'weekly-summary',
    'monthly-summary'
  ],
  tables: [
    'workout-logs',
    'workout-summary-table'
  ],
  charts: [
    'volume-over-time',
    'fatigue-by-muscle',
    'progression-fatigue',
    'progression-muscle',
    'muscle-distribution'
  ],
  features: [
    'workout-features',
    'todo-list',
    'progress-goals',
    'achievements'
  ]
};

// Widget names for display
export const widgetNames: Record<DashboardWidgetId, string> = {
  'status': 'Workout Status',
  'train': 'Ready to Train',
  'rest': 'Needs Rest',
  'streak-tracker': 'Streak Tracker',
  'workout-count': 'Workout Count',
  'total-volume': 'Total Volume',
  'workout-summary': 'Latest Workout',
  'weekly-summary': 'Weekly Summary',
  'monthly-summary': 'Monthly Progress',
  'workout-logs': 'Workout Log History',
  'workout-summary-table': 'Workout Summary',
  'volume-over-time': 'Volume Over Time',
  'fatigue-by-muscle': 'Muscle Fatigue',
  'progression-fatigue': 'Progression & Fatigue',
  'progression-muscle': 'Muscle Progression',
  'muscle-distribution': 'Muscle Distribution',
  'workout-features': 'Workout Features',
  'todo-list': 'Todo List',
  'progress-goals': 'Progress Goals',
  'achievements': 'Achievements'
};

// Helper function to get widget title
export const getWidgetTitle = (widgetId: DashboardWidgetId): string => {
  return widgetNames[widgetId] || widgetId;
};

/**
 * Get recent workout logs for quick add
 * @param logs Array of workout logs
 * @returns Array of recent logs for quick add menu
 */
export const getRecentWorkoutLogs = (logs: WorkoutLog[]): WorkoutLog[] => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return [];
  }

  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  // Get unique exercises from the last 2 weeks
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const recentLogs = sortedLogs.filter(log => 
    new Date(log.date) >= twoWeeksAgo
  );
  
  // Create unique exercise+muscle group combinations
  const uniqueExercises = new Map<string, WorkoutLog>();
  
  recentLogs.forEach(log => {
    const key = `${log.exercise}-${log.muscleGroup}`;
    if (!uniqueExercises.has(key)) {
      uniqueExercises.set(key, log);
    }
  });
  
  // Return up to 10 most recent unique exercises
  return Array.from(uniqueExercises.values()).slice(0, 10);
};

/**
 * Convert workout logs to chart data format
 * @param logs Array of workout logs
 * @returns Chart data object with datasets
 */
export const convertLogsToChartData = (logs: WorkoutLog[]) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }
  
  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    const date = log.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {} as Record<string, WorkoutLog[]>);
  
  // Sort dates
  const sortedDates = Object.keys(logsByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  // Format dates for display
  const labels = sortedDates.map(date => 
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
  
  // Calculate total volume per date
  const volumeData = sortedDates.map(date => {
    const dailyLogs = logsByDate[date];
    return dailyLogs.reduce((sum, log) => {
      const weight = typeof log.weight === 'number' ? log.weight : 0;
      const reps = typeof log.reps === 'number' ? log.reps : 0;
      return sum + (weight * reps);
    }, 0);
  });
  
  return {
    labels,
    datasets: [
      {
        label: 'Total Volume',
        data: volumeData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };
};

/**
 * Calculate workout streak from logs
 * @param logs Array of workout logs
 * @returns Current streak and max streak
 */
export const calculateWorkoutStreak = (logs: WorkoutLog[]) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }
  
  // Get unique workout dates
  const uniqueDates = new Set<string>();
  logs.forEach(log => {
    if (log.date) {
      // Normalize date to YYYY-MM-DD
      const date = new Date(log.date);
      const normalizedDate = date.toISOString().split('T')[0];
      uniqueDates.add(normalizedDate);
    }
  });
  
  // Convert to array and sort
  const sortedDates = Array.from(uniqueDates).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  // No workout dates
  if (sortedDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if worked out today
  const todayFormatted = today.toISOString().split('T')[0];
  const workedOutToday = uniqueDates.has(todayFormatted);
  
  // If worked out today, start from today, otherwise start from yesterday
  const startDate = new Date(today);
  if (!workedOutToday) {
    startDate.setDate(startDate.getDate() - 1);
  }
  
  // Check each day going backwards
  let checkDate = startDate;
  while (true) {
    const checkDateFormatted = checkDate.toISOString().split('T')[0];
    
    if (uniqueDates.has(checkDateFormatted)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate max streak
  let maxStreak = 0;
  let currentMaxStreak = 0;
  
  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    
    if (i === 0) {
      currentMaxStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        // Consecutive day
        currentMaxStreak++;
      } else {
        // Break in streak
        maxStreak = Math.max(maxStreak, currentMaxStreak);
        currentMaxStreak = 1;
      }
    }
  }
  
  // Update max streak one final time
  maxStreak = Math.max(maxStreak, currentMaxStreak);
  
  return { currentStreak, maxStreak };
};