export interface WorkoutTemplate {
  name: string;
  description: string;
  exercises: {
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
  }[];
  createdAt: string;
  lastUsed: string;
}
