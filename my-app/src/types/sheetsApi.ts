import { Todo, WorkoutTemplate, WorkoutLog } from '../types';

export interface PendingMutation {
  id: string;
  type: string;
  payload: any;
}

export interface GoogleApiConfig {
  API_KEY: string;
  CLIENT_ID: string;
  SPREADSHEET_ID: string;
  DISCOVERY_DOCS: string[];
  SCOPES: string;
}

export interface CacheConfig {
  DATA_CACHE_NAME: string;
}

export interface SheetValues {
  values: any[][];
}

export interface SheetResponse {
  result: SheetValues;
  status?: number;
}

export interface ApiResult {
  success: boolean;
  data?: any;
  fromCache?: boolean;
  error?: any;
}

export interface MutationRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

export interface WorkoutData {
  templateName: string;
  templateId: number;
  exercises: any[];
  startTime: string;
  endTime: string | null;
}

export interface TodaysWorkout {
  date: string;
  workoutData: WorkoutData;
  completed: boolean;
  notes: string;
  rowIndex?: number;
}