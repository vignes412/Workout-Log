/**
 * WorkoutService.ts
 * Service for handling local storage operations related to workouts
 */

export interface Workout {
  [key: string]: any;
  completedAt?: string;
}

const TODAYS_WORKOUT_KEY = 'todaysWorkout';
const WORKOUT_HISTORY_KEY = 'workoutHistory';

const WorkoutService = {
  /**
   * Get today's workout from local storage
   * @returns The workout object or null if not found
   */
  getTodaysWorkout: (): Workout | null => {
    try {
      const workoutJson = localStorage.getItem(TODAYS_WORKOUT_KEY);
      return workoutJson ? JSON.parse(workoutJson) : null;
    } catch (error) {
      console.error('Error getting today\'s workout from local storage:', error);
      return null;
    }
  },

  /**
   * Save or update today's workout in local storage
   * @param workout - The workout object to save
   * @returns Success status
   */
  updateTodaysWorkout: async (workout: Workout): Promise<boolean> => {
    try {
      localStorage.setItem(TODAYS_WORKOUT_KEY, JSON.stringify(workout));
      return true;
    } catch (error) {
      console.error('Error saving today\'s workout to local storage:', error);
      return false;
    }
  },

  /**
   * Clear today's workout from local storage
   * @returns Success status
   */
  clearTodaysWorkout: async (): Promise<boolean> => {
    try {
      localStorage.removeItem(TODAYS_WORKOUT_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing today\'s workout from local storage:', error);
      return false;
    }
  },

  /**
   * Get workout history from local storage
   * @returns Array of workout history objects
   */
  getWorkoutHistory: (): Workout[] => {
    try {
      const historyJson = localStorage.getItem(WORKOUT_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting workout history from local storage:', error);
      return [];
    }
  },

  /**
   * Add a completed workout to history
   * @param workout - The completed workout to add to history
   * @returns Success status
   */
  addWorkoutToHistory: async (workout: Workout): Promise<boolean> => {
    try {
      // Get current history
      const history = WorkoutService.getWorkoutHistory();
      
      // Add completion timestamp
      const workoutWithTimestamp = {
        ...workout,
        completedAt: new Date().toISOString()
      };
      
      // Add to history
      history.push(workoutWithTimestamp);
      
      // Save updated history
      localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
      
      // Clear today's workout since it's now in history
      await WorkoutService.clearTodaysWorkout();
      
      return true;
    } catch (error) {
      console.error('Error adding workout to history:', error);
      return false;
    }
  }
};

export default WorkoutService;