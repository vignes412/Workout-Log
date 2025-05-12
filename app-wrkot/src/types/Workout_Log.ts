export interface WorkoutLogEntry {
  date: string;
  muscleGroup: string;
  exercise: string;
  reps: number;
  weight: number;
  rating: number;
  restTime: number | null;
}
