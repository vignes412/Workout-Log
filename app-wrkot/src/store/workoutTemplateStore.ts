// filepath: c:\backup\Workout Log\app-wrkot\src\store\workoutTemplateStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutTemplate, ActiveWorkout, WorkoutExercise } from '@/types/Workout_Templates';
import { createSpreadsheetRow, readSpreadsheetData, GenericSheetRowData } from '@/lib/spreadsheetAPI';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutTemplateState {
  templates: WorkoutTemplate[];
  isLoading: boolean;
  error: string | null;
  isDataFetched: boolean;
  activeWorkout: ActiveWorkout | null;
  fetchTemplates: (forceRefresh?: boolean) => Promise<void>;
  saveTemplate: (template: WorkoutTemplate) => Promise<{success: boolean; error?: string}>;
  deleteTemplate: (templateName: string) => Promise<{success: boolean; error?: string}>;
  getTemplateByName: (name: string) => WorkoutTemplate | undefined;
  updateTemplate: (template: WorkoutTemplate) => void;
  
  // Active workout functions
  startWorkout: (templateName: string) => Promise<{success: boolean; error?: string}>;
  completeWorkout: () => Promise<{success: boolean; error?: string}>;
  updateActiveWorkout: (workout: Partial<ActiveWorkout>) => void;
  updateExerciseProgress: (exerciseIndex: number, setsCompleted: number) => void;
  addExerciseSet: (exerciseIndex: number) => void;
  cancelWorkout: () => void;
  getActiveWorkout: () => ActiveWorkout | null;
}

export const useWorkoutTemplateStore = create<WorkoutTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
      isLoading: false,
      error: null,
      isDataFetched: false,
      activeWorkout: null,
      
      fetchTemplates: async (forceRefresh = false) => {
        const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
        if (!isOnline && !forceRefresh) {
          console.log('Offline, using cached workout template data.');
          set({ isLoading: false, error: null });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const sheetName = 'WorkoutTemplates';
          const result = await readSpreadsheetData<GenericSheetRowData>(sheetName);
          
          if (result.success && result.data) {
            const templatesData: WorkoutTemplate[] = result.data.map((row: GenericSheetRowData) => {
              const exercisesStr = String(row['Exercises'] || '[]');
              let exercises = [];
                try {
                exercises = JSON.parse(exercisesStr);
              } catch (error) {
                console.error('Failed to parse exercises JSON for template:', row['Name'], error);
              }
              
              return {
                name: String(row['Name'] || ''),
                description: String(row['Description'] || ''),
                exercises,
                createdAt: String(row['CreatedAt'] || new Date().toISOString()),
                lastUsed: String(row['LastUsed'] || '')
              };
            }).filter((template: WorkoutTemplate) => template.name);

            set({ 
              templates: templatesData,
              isLoading: false,
              isDataFetched: true
            });
          } else {
            set({ 
              error: result.error || 'Failed to fetch workout templates.', 
              isLoading: false
            });
          }
        } catch (err) {
          console.error('Error fetching workout templates:', err);
          set({ 
            error: (err as Error).message, 
            isLoading: false
          });
        }
      },
      
      saveTemplate: async (template: WorkoutTemplate) => {
        try {
          const sheetName = 'WorkoutTemplates';
          // Convert exercises array to JSON string for storage in Google Sheets
          const rowData = {
            Name: template.name,
            Description: template.description,
            Exercises: JSON.stringify(template.exercises),
            CreatedAt: template.createdAt || new Date().toISOString(),
            LastUsed: template.lastUsed || ''
          };
          
          const result = await createSpreadsheetRow(sheetName, rowData);
          
          if (result.success) {
            // Update local state with the new template
            set(state => ({
              templates: [...state.templates, template]
            }));
            return { success: true };
          } else {
            return { success: false, error: result.error };
          }
        } catch (err) {
          console.error('Error saving workout template:', err);
          return { success: false, error: (err as Error).message };
        }
      },
      
      deleteTemplate: async (templateName: string) => {
        // Since deleteSpreadsheetRow is not fully implemented (as seen in spreadsheetAPI.ts),
        // we'll just update local state for now
        try {
          set(state => ({
            templates: state.templates.filter(t => t.name !== templateName)
          }));
          return { success: true };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      },
      
      getTemplateByName: (name: string) => {
        return get().templates.find(t => t.name === name);
      },
        updateTemplate: (template: WorkoutTemplate) => {
        set(state => ({
          templates: state.templates.map(t => 
            t.name === template.name ? template : t
          )
        }));
      },
      
      // Start a workout from a template
      startWorkout: async (templateName: string) => {
        try {
          const template = get().getTemplateByName(templateName);
          
          if (!template) {
            return { success: false, error: 'Template not found' };
          }
          
          const now = new Date().toISOString();
          
          // Create a deep copy of the exercises array to avoid reference issues
          const exercises = template.exercises.map(ex => ({
            ...ex,
            setsCompleted: 0,
            percentComplete: 0
          }));
          
          const newWorkout: ActiveWorkout = {
            id: uuidv4(),
            templateName: template.name,
            description: template.description,
            startTime: now,
            lastUpdated: now,
            isCompleted: false,
            exercises: exercises,
            notes: ''
          };
          
          // Update the lastUsed field of the template
          const updatedTemplate = {
            ...template,
            lastUsed: now
          };
          
          get().updateTemplate(updatedTemplate);
          
          set({ activeWorkout: newWorkout });
          
          return { success: true };
        } catch (err) {
          console.error('Error starting workout:', err);
          return { success: false, error: (err as Error).message };
        }
      },

      // Mark the current active workout as completed
      completeWorkout: async () => {
        try {
          const activeWorkout = get().activeWorkout;
          
          if (!activeWorkout) {
            return { success: false, error: 'No active workout found' };
          }
          
          const completedWorkout: ActiveWorkout = {
            ...activeWorkout,
            isCompleted: true,
            lastUpdated: new Date().toISOString(),
            duration: Math.round((Date.now() - new Date(activeWorkout.startTime).getTime()) / 60000) // duration in minutes
          };
          
          // Here you could add code to save the completed workout to a history
          // For now, just clear the active workout
          set({ activeWorkout: null });
          
          return { success: true };
        } catch (err) {
          console.error('Error completing workout:', err);
          return { success: false, error: (err as Error).message };
        }
      },

      // Update the active workout details
      updateActiveWorkout: (workout: Partial<ActiveWorkout>) => {
        set(state => {
          if (!state.activeWorkout) return state;
          
          return {
            activeWorkout: {
              ...state.activeWorkout,
              ...workout,
              lastUpdated: new Date().toISOString()
            }
          };
        });
      },
      
      // Update the progress of an exercise in the active workout
      updateExerciseProgress: (exerciseIndex: number, setsCompleted: number) => {
        set(state => {
          if (!state.activeWorkout) return state;
          
          const exercises = [...state.activeWorkout.exercises];
          
          if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
            const exercise = exercises[exerciseIndex];
            const updatedExercise = {
              ...exercise,
              setsCompleted,
              percentComplete: (setsCompleted / exercise.sets) * 100
            };
            
            exercises[exerciseIndex] = updatedExercise;
            
            return {
              activeWorkout: {
                ...state.activeWorkout,
                exercises,
                lastUpdated: new Date().toISOString()
              }
            };
          }
          
          return state;
        });
      },
      
      // Add an extra set to an exercise
      addExerciseSet: (exerciseIndex: number) => {
        set(state => {
          if (!state.activeWorkout) return state;
          
          const exercises = [...state.activeWorkout.exercises];
          
          if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
            const exercise = exercises[exerciseIndex];
            const updatedExercise = {
              ...exercise,
              sets: exercise.sets + 1
            };
            
            exercises[exerciseIndex] = updatedExercise;
            
            return {
              activeWorkout: {
                ...state.activeWorkout,
                exercises,
                lastUpdated: new Date().toISOString()
              }
            };
          }
          
          return state;
        });
      },
      
      // Cancel the active workout
      cancelWorkout: () => {
        set({ activeWorkout: null });
      },
      
      // Get the current active workout
      getActiveWorkout: () => {
        return get().activeWorkout;
      }
    }),
    {
      name: 'workout-templates-storage',
      partialize: (state) => ({
        templates: state.templates,
        isDataFetched: state.isDataFetched,
        activeWorkout: state.activeWorkout
      })
    }
  )
);