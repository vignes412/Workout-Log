export interface WorkoutLogEntry {
  id: string; // Unique identifier for the log entry
  date: string;
  muscleGroup: string;
  exercise: string;
  reps: number;
  weight: number;
  rating: number;
  restTime?: number | null;
  rowIndex?: number; // Optional: For direct sheet manipulation if needed
  isSynced?: boolean; // Optional: To track if the log is synced with the backend
}
