export interface WorkoutExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number;
  notes: string;
  difficultyLevel: string;
  equipmentRequired: string;
  targetIntensity: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroup: string;
  exerciseDuration: string;
  recoveryTime: string;
  exerciseType: string;
  caloriesBurned: string;
  exerciseProgression: string;
  injuryRiskLevel: string;
  exerciseLink: string;
  imageLink: string;
  relativePath: string;
  // Fields for tracking progress during an active workout
  setsCompleted?: number;
  percentComplete?: number;
}

export interface WorkoutTemplate {
  name: string;
  description: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  lastUsed: string;
}

export interface ActiveWorkout {
  id: string;
  templateName: string;
  description: string;
  startTime: string;
  lastUpdated: string;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
  notes: string;
  duration?: number; // duration in minutes
}
