import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WorkoutLogEntry } from '@/types/Workout_Log';
import {
  readSpreadsheetData,
  createSpreadsheetRow,
  updateSpreadsheetRow,
  deleteSpreadsheetRow,
  GenericSheetRowData,
} from '@/lib/spreadsheetAPI';

interface WorkoutLogState {
  workoutLogs: WorkoutLogEntry[];
  isLoading: boolean;
  error: string | null;
  isDataFetched: boolean;
  fetchWorkoutLogs: (forceRefresh?: boolean) => Promise<void>;
  addWorkoutLog: (newLog: Omit<WorkoutLogEntry, 'id' | 'rowIndex'>) => Promise<WorkoutLogEntry | null>;
  editWorkoutLog: (updatedLog: WorkoutLogEntry) => Promise<void>;
  removeWorkoutLog: (logId: string) => Promise<void>;
  syncPendingLogs: () => Promise<void>;
}

const generateId = () => `log_${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}`;

type WorkoutLogSheetData = Omit<WorkoutLogEntry, 'id' | 'rowIndex'>;

export const useWorkoutLogStore = create<WorkoutLogState>()(
  persist(
    (set, get) => ({
      workoutLogs: [],
      isLoading: false,
      error: null,
      isDataFetched: false,
      fetchWorkoutLogs: async (forceRefresh = false) => {
        if (!forceRefresh && get().isDataFetched && navigator.onLine) {
          return;
        }

        set({ isLoading: true, error: null });

        if (!navigator.onLine) {
          if (get().workoutLogs.length > 0) {
            set({ isLoading: false, isDataFetched: true });
            return;
          }
          set({ error: 'Offline and no data cached.', isLoading: false, isDataFetched: false });
          return;
        }

        try {
          const sheetName = 'Workout_Logs';
          const result = await readSpreadsheetData<GenericSheetRowData>(sheetName);

          if (result.success && result.data) {
            const logsWithClientFields = result.data.map((rawRow, index) => {
              const mappedRow = {
                date: String(rawRow['date'] || rawRow['Date'] || 'N/A'),
                muscleGroup: String(rawRow['muscleGroup'] || rawRow['Muscle Group'] || 'N/A'),
                exercise: String(rawRow['exercise'] || rawRow['Exercise'] || 'N/A'),
                reps: parseFloat(String(rawRow['reps'] || rawRow['Reps'])),
                weight: parseFloat(String(rawRow['weight'] || rawRow['Weight'])),
                rating: parseFloat(String(rawRow['rating'] || rawRow['Rating'])),
                restTime: rawRow['restTime'] || rawRow['Rest Time'] || rawRow['Rest (s)']
                  ? parseFloat(String(rawRow['restTime'] || rawRow['Rest Time'] || rawRow['Rest (s)']))
                  : null,
              };

              if (mappedRow.date === 'N/A' || mappedRow.exercise === 'N/A') {
                console.warn('Skipping row due to missing essential data (date/exercise) after mapping:', rawRow);
                return null;
              }
              if (isNaN(mappedRow.reps)) mappedRow.reps = 0;
              if (isNaN(mappedRow.weight)) mappedRow.weight = 0;
              if (isNaN(mappedRow.rating)) mappedRow.rating = 0;
              if (mappedRow.restTime !== null && isNaN(mappedRow.restTime)) mappedRow.restTime = null;

              return {
                ...mappedRow,
                id: generateId(),
                rowIndex: index + 2,
                isSynced: true,
              } as WorkoutLogEntry;
            }).filter(log => log !== null) as WorkoutLogEntry[];

            set({ workoutLogs: logsWithClientFields, isLoading: false, isDataFetched: true, error: null });
          } else {
            console.error('Failed to fetch workout logs from sheet:', result.error);
            set({ error: result.error || 'Failed to fetch workout logs.', isLoading: false, isDataFetched: false });
          }
        } catch (err) {
          const error = err as Error;
          console.error('Error in fetchWorkoutLogs:', error);
          set({ error: error.message, isLoading: false, isDataFetched: false });
        }
      },
      addWorkoutLog: async (newLogData: Omit<WorkoutLogEntry, 'id' | 'rowIndex' | 'isSynced'>) => {
        const localId = generateId();
        const entryWithLocalId: WorkoutLogEntry = {
          ...newLogData,
          id: localId,
          isSynced: false,
        };

        set(state => ({
          workoutLogs: [entryWithLocalId, ...state.workoutLogs],
          isLoading: navigator.onLine,
          error: null,
        }));

        if (!navigator.onLine) {
          console.warn('Offline: Workout log added to local cache. Will sync when online.');
          return entryWithLocalId;
        }

        try {
          const sheetName = 'Workout_Logs';
          const sheetRow: GenericSheetRowData = {
            date: newLogData.date,
            muscleGroup: newLogData.muscleGroup,
            exercise: newLogData.exercise,
            reps: newLogData.reps,
            weight: newLogData.weight,
            rating: newLogData.rating,
            restTime: newLogData.restTime ?? '',
          };

          const response = await createSpreadsheetRow(sheetName, sheetRow);

          if (response.success) {
            set(state => ({
              workoutLogs: state.workoutLogs.map(log =>
                log.id === localId
                  ? { ...log, isSynced: true, rowIndex: response.rowId ? parseInt(response.rowId.split('!').pop() || '0') : undefined }
                  : log
              ),
              isLoading: false,
            }));
            return { ...entryWithLocalId, isSynced: true };
          } else {
            throw new Error(response.error || 'Failed to create spreadsheet row.');
          }
        } catch (error) {
          console.error('Failed to add workout log to sheet:', error);
          set(state => ({
            isLoading: false,
            error: (error as Error).message,
            workoutLogs: state.workoutLogs.map(log => log.id === localId ? { ...log, isSynced: false } : log),
          }));
          return entryWithLocalId;
        }
      },
      editWorkoutLog: async (updatedLog) => {
        if (navigator.onLine) {
          set({ isLoading: true });
        } else {
          console.warn('Attempted to edit workout log while offline. Applying optimistically to cache.');
        }
        try {
          if (typeof updatedLog.rowIndex !== 'number') {
            throw new Error('Row index is missing for updating the log.');
          }
          const sheetName = 'Workout_Logs';

          const dataToUpdate: WorkoutLogSheetData = {
            date: updatedLog.date,
            muscleGroup: updatedLog.muscleGroup,
            exercise: updatedLog.exercise,
            reps: updatedLog.reps,
            weight: updatedLog.weight,
            rating: updatedLog.rating,
            restTime: updatedLog.restTime,
          };

          const sheetRowUpdate: GenericSheetRowData = { ...dataToUpdate };
          if (sheetRowUpdate.restTime === null) sheetRowUpdate.restTime = '';

          const response = await updateSpreadsheetRow(sheetName, updatedLog.rowIndex, sheetRowUpdate);

          if (!response.success) {
            throw new Error(response.error || 'Failed to update spreadsheet row.');
          }

          set((state) => ({
            workoutLogs: state.workoutLogs.map((log) =>
              log.id === updatedLog.id ? { ...log, ...updatedLog } : log
            ),
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Failed to edit workout log:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      removeWorkoutLog: async (logId: string) => {
        const logToDelete = get().workoutLogs.find(log => log.id === logId);

        if (!logToDelete || typeof logToDelete.rowIndex !== 'number') {
          set({ error: 'Log not found or rowIndex missing for deletion.', isLoading: false });
          console.error('Log not found or rowIndex missing for deletion:', logId, logToDelete);
          return;
        }

        if (navigator.onLine) {
          set({ isLoading: true });
        } else {
          console.warn('Attempted to delete workout log while offline. Applying optimistically to cache.');
        }

        try {
          const sheetName = 'Workout_Logs';
          const response = await deleteSpreadsheetRow(sheetName, logToDelete.rowIndex);

          if (!response.success) {
            throw new Error(response.error || 'Failed to delete spreadsheet row.');
          }

          set((state) => ({
            workoutLogs: state.workoutLogs.filter((log) => log.id !== logId),
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          console.error('Failed to delete workout log:', error);
          set({ error: (error as Error).message, isLoading: false });
        }
      },
      syncPendingLogs: async () => {
        const pendingLogs = get().workoutLogs.filter(log => !log.isSynced);
        if (pendingLogs.length === 0) {
          return;
        }

        if (!navigator.onLine) {
          return;
        }

        set({ isLoading: true, error: null });

        for (const log of pendingLogs) {
          try {
            const sheetRow: GenericSheetRowData = {
              date: log.date,
              muscleGroup: log.muscleGroup,
              exercise: log.exercise,
              reps: log.reps,
              weight: log.weight,
              rating: log.rating,
              restTime: log.restTime ?? '',
            };
            const response = await createSpreadsheetRow('Workout_Logs', sheetRow);
            if (response.success) {
              set(state => ({
                workoutLogs: state.workoutLogs.map(l =>
                  l.id === log.id
                    ? { ...l, isSynced: true, rowIndex: response.rowId ? parseInt(response.rowId.split('!').pop() || '0') : undefined }
                    : l
                ),
              }));
            } else {
              throw new Error(response.error || 'Sync failed for a log');
            }
          } catch (error) {
            console.error('Error syncing log:', log.id, error);
            set({ error: (error as Error).message });
            break;
          }
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'workout-log-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (_persistedState) => {
        return (_rehydratedState, error) => {
          if (error) {
            console.error('Error rehydrating workout log store:', error);
          }
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            setTimeout(() => {
              if (
                useWorkoutLogStore &&
                typeof useWorkoutLogStore.getState === 'function' &&
                typeof useWorkoutLogStore.getState().syncPendingLogs === 'function'
              ) {
                useWorkoutLogStore.getState().syncPendingLogs();
              } else {
                console.warn('Attempted to call syncPendingLogs on rehydration, but the store or method was not available at that moment.');
              }
            }, 0);
          }
        };
      },
      partialize: (state) => ({
        workoutLogs: state.workoutLogs,
        isDataFetched: state.isDataFetched,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useWorkoutLogStore.getState().syncPendingLogs();
  });
}
