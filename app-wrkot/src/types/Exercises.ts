export interface Exercise {
  muscleGroup: string;
  exercise: string;
  difficultyLevel: string;
  equipmentRequired: string;
  targetIntensity: string | number;
  primaryMuscleGroup: string;
  secondaryMuscleGroup: string | null;
  exerciseDuration: string;
  recoveryTime: string;
  exerciseType: string;
  caloriesBurned: number;
  exerciseProgression: string;
  injuryRiskLevel: string;
  exerciseLink: string;
  imageLink: string;
  relatedPath: string;
}
