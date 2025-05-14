// Define the core types for the application

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  idToken?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  idToken?: string;
}

// App state
export interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  currentPage: string;
  themeMode: string;
  logs: any[] | null;
  exercises: Exercise[];
  isLoading: {
    logs: boolean;
    exercises: boolean;
    [key: string]: boolean;
  };
}

// Action types
export interface AppAction {
  type: string;
  payload: any;
}

// Component props
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
}

// Data models
export interface Exercise {
  muscleGroup: string;
  exercise: string;
  exerciseLink?: string;
  imageLink?: string;
  [key: string]: any;
}

export interface WorkoutLog {
  date: string;
  muscleGroup: string;
  exercise: string;
  reps: number | string;
  weight: number | string;
  rating?: number | string;
  [key: string]: any;
}

export interface WorkoutTemplate {
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  lastUsed: string;
  rowIndex?: number;
  createdAt: string; // Add this required property
  [key: string]: any;
}

export interface TemplateExercise {
  muscleGroup: string;
  name: string;
  sets: number;
  reps: number;
  weight?: string | number;
  notes?: string;
  restTime?: number;
  setsCompleted?: number;
  [key: string]: any;
}

export interface Measurement {
  date: Date | null | import("dayjs").Dayjs;
  weight: string | number;
  neckRelaxed?: string | number;
  shouldersRelaxed?: string | number;
  chestRelaxed?: string | number;
  chestFlexed?: string | number;
  upperChestRelaxed?: string | number;
  lowerChestRelaxed?: string | number;
  leftUpperArmRelaxed?: string | number;
  leftUpperArmFlexed?: string | number;
  rightUpperArmRelaxed?: string | number;
  rightUpperArmFlexed?: string | number;
  leftForearmRelaxed?: string | number;
  rightForearmRelaxed?: string | number;
  leftWristRelaxed?: string | number;
  rightWristRelaxed?: string | number;
  waistRelaxed?: string | number;
  abdomenRelaxed?: string | number;
  hipsRelaxed?: string | number;
  leftUpperThighRelaxed?: string | number;
  rightUpperThighRelaxed?: string | number;
  leftMidThighRelaxed?: string | number;
  rightMidThighRelaxed?: string | number;
  leftLowerThighRelaxed?: string | number;
  rightLowerThighRelaxed?: string | number;
  leftCalvesRelaxed?: string | number;
  rightCalvesRelaxed?: string | number;
  leftAnkleRelaxed?: string | number;
  rightAnkleRelaxed?: string | number;
  [key: string]: any;
}

// Today's workout related types
export interface WorkoutExercise {
  exercise: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: string | number;
  setsCompleted?: number;
  restTime?: number;
  restBetweenSets?: number; // Added this property
  notes?: string;
}

export interface WorkoutData {
  templateName: string;
  startTime: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface TodaysWorkout {
  date: string;
  workoutData: WorkoutData;
  completed?: boolean;
  endTime?: string;
}

// Completed workout definition
export interface CompletedWorkout {
  date: string;
  templateName: string;
  exercises: WorkoutExercise[];
  duration: number;
  notes?: string;
}

// LogEntry and related types
export interface LogEntry extends Array<string | number> {
  0: string; // date
  1: string; // muscle group
  2: string; // exercise name
  3: number; // reps
  4: number | string; // weight (can be numeric or "Bodyweight")
  5: number; // rating
}

// Todo item definition
export interface Todo {
  id?: string;
  text: string;
  completed: boolean;
  createdAt?: string;
  completedAt?: string;
}

// API and data fetching types
export interface SheetDataOptions {
  initialFetch?: boolean;
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface SheetDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  revalidate: (skipCache?: boolean) => Promise<void>;
  mutate: (newData: T, shouldRevalidate?: boolean) => void;
}

// Config types
export interface GoogleConfig {
  API_KEY: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SPREADSHEET_ID: string;
  DISCOVERY_DOCS: string[];
  SCOPES: string;
}

export interface CacheConfig {
  DATA_CACHE_NAME: string;
}

export interface AppConfig {
  google: GoogleConfig;
  cache: CacheConfig;
}

// Navigation and UI types
export interface NavigationProps {
  onNavigate: (page: string) => void;
  toggleTheme?: () => void;
  themeMode?: string;
}

export interface DashboardLayout {
  visibility: DashboardVisibility;
}

// Dashboard visibility type
export interface DashboardVisibility {
  status: boolean;
  train: boolean;
  rest: boolean;
  "workout-features": boolean;
  "workout-logs": boolean;
  "muscle-distribution": boolean;
  "workout-count": boolean;
  "total-volume": boolean;
  "todo-list": boolean;
  "workout-summary": boolean;
  "progression-fatigue": boolean;
  "progression-muscle": boolean;
  "volume-over-time": boolean;
  "fatigue-by-muscle": boolean;
  "progress-goals": boolean;
  "body-weight": boolean;
  achievements: boolean;
  "weekly-summary": boolean;
  "monthly-summary": boolean;
  "streak-tracker": boolean;
  [key: string]: boolean;
}

// Batch fetch types
export interface BatchFetchRequest {
  range: string;
  cacheKey: string;
  mapFn?: (row: any) => any;
}

export interface BatchFetchResult {
  [key: string]: {
    data: any;
    error: Error | null;
  };
}

// User settings definition
export interface UserSettings {
  themeMode: 'light' | 'dark';
  defaultRestTime: number;
  metricUnits: boolean;
  dashboardLayout: DashboardLayout;
  notifications: {
    enabled: boolean;
    workoutReminders: boolean;
    progressUpdates: boolean;
    restTimers: boolean;
  };
  privacy: {
    shareData: boolean;
    anonymousAnalytics: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
  [key: string]: any;
}

// Workout templates props
export interface WorkoutTemplatesProps {
  accessToken: string | null;
  onNavigate: (page: string) => void;
  themeMode: 'light' | 'dark';
  onLogout?: () => void;
  toggleTheme: () => void; // Add this line
}