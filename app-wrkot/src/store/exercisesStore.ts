import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise } from '@/types/Exercises';
import { readSpreadsheetData, GenericSheetRowData } from '@/lib/spreadsheetAPI';

interface ExerciseGroup {
  muscleGroup: string;
  exercises: string[];
}

interface ExercisesState {
  exercises: Exercise[];
  exerciseGroups: ExerciseGroup[];
  isLoading: boolean;
  error: string | null;
  isDataFetched: boolean;
  fetchExercises: () => Promise<void>;
  getExercisesByMuscleGroup: (muscleGroup: string) => string[];
  getMuscleGroupsByExercise: (exercise: string) => string[];
}

export const useExercisesStore = create<ExercisesState>()(
  persist(
    (set, get) => ({
      exercises: [],
      exerciseGroups: [],
      isLoading: false,
      error: null,
      isDataFetched: false,
      
      fetchExercises: async () => {
        // Skip if already fetched and we're online (to avoid unnecessary API calls)
        if (get().isDataFetched && navigator.onLine) {
          return;
        }

        // If offline, use cached data if available
        if (!navigator.onLine) {
          if (get().exercises.length > 0) {
            console.log('Offline, using cached exercise data.');
            return;
          } else {
            set({ error: 'Offline and no exercise data cached.', isLoading: false });
            return;
          }
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const sheetName = 'Exercises';
          const result = await readSpreadsheetData<GenericSheetRowData>(sheetName);
          
          if (result.success && result.data) {
            const exercisesData: Exercise[] = result.data.map((row: GenericSheetRowData) => ({
                    muscleGroup: String(row['Muscle_Group'] || ''),
                    exercise: String(row['Exercise'] || ''),
                    difficultyLevel: String(row['Difficulty_Level'] || ''),
                    equipmentRequired: String(row['Equipment_Required'] || ''),
                    targetIntensity: String(row['Target_Intensity'] || ''),
                    primaryMuscleGroup: String(row['Primary_Muscle_Group'] || ''),
                    secondaryMuscleGroup: String(row['Secondary_Muscle_Group'] || '') || null,
                    exerciseDuration: String(row['Exercise_Duration'] || ''),
                    recoveryTime: String(row['Recovery_Time'] || ''),
                    exerciseType: String(row['Exercise_Type'] || ''),
                    caloriesBurned: Number(row['Calories_Burned'] || 0),
                    exerciseProgression: String(row['Exercise_Progression'] || ''),
                    injuryRiskLevel: String(row['Injury_Risk_Level'] || ''),
                    exerciseLink: String(row['exercise_link'] || ''),
                    imageLink: String(row['image_link'] || ''),
                    relatedPath: String(row['related_path'] || ''),   
            })).filter((exercise: Exercise) => exercise.muscleGroup && exercise.exercise);

            // Generate muscle group to exercises mapping for easier filtering
            const exerciseGroupsMap = new Map<string, string[]>();
            exercisesData.forEach(ex => {
              if (!exerciseGroupsMap.has(ex.muscleGroup)) {
                exerciseGroupsMap.set(ex.muscleGroup, []);
              }
              const exercises = exerciseGroupsMap.get(ex.muscleGroup);
              if (exercises && !exercises.includes(ex.exercise)) {
                exercises.push(ex.exercise);
              }
            });

            const exerciseGroups = Array.from(exerciseGroupsMap.entries()).map(([muscleGroup, exercises]) => ({
              muscleGroup,
              exercises
            }));

            set({ 
              exercises: exercisesData, 
              exerciseGroups,
              isLoading: false,
              isDataFetched: true
            });
          } else {
            set({ 
              error: result.error || 'Failed to fetch exercises data.', 
              isLoading: false
            });
          }
        } catch (err) {
          console.error('Error fetching exercises:', err);
          set({ 
            error: (err as Error).message, 
            isLoading: false
          });
        }
      },
      
      getExercisesByMuscleGroup: (muscleGroup: string) => {
        const group = get().exerciseGroups.find(g => 
          g.muscleGroup.toLowerCase() === muscleGroup.toLowerCase());
        return group ? group.exercises : [];
      },
      
      getMuscleGroupsByExercise: (exercise: string) => {
        const muscleGroups = new Set<string>();
        get().exercises.forEach(ex => {
          if (ex.exercise.toLowerCase() === exercise.toLowerCase()) {
            muscleGroups.add(ex.muscleGroup);
          }
        });
        return Array.from(muscleGroups);
      }
    }),
    {
      name: 'exercises-storage',
      partialize: (state) => ({
        exercises: state.exercises,
        exerciseGroups: state.exerciseGroups,
        isDataFetched: state.isDataFetched
      })
    }
  )
);
