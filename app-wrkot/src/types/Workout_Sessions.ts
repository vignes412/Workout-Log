export interface WorkoutSession {
  date: string;
  workoutData: {
    templateName: string;
    templateId: number;
    exercises: {
      muscleGroup: string;
      exercise: string;
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
      sets: number;
      reps: number;
      weight: number;
      rest: number;
      notes: string;
      setsCompleted: number;
      percentComplete: number;
    }[];
    startTime: string;
    endTime: string | null;
  };
  completed: boolean;
  notes: string;
}
