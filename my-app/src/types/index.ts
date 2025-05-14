// Core application types

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
}

// AppState managed by context
export interface AppState {
  isAuthenticated: boolean;
  accessToken: string | null;
  currentPage: string;
  themeMode: 'light' | 'dark';
  logs: LogEntry[] | null;
  exercises: Exercise[];
  isLoading: {
    logs: boolean;
    exercises: boolean;
    [key: string]: boolean;
  };
}

// Action types for reducer
export type AppAction = 
  | { type: 'SET_AUTHENTICATION'; payload: AuthState }
  | { type: 'SET_PAGE'; payload: string }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOGS'; payload: LogEntry[] }
  | { type: 'SET_EXERCISES'; payload: Exercise[] }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } };

// Log entry as stored in the workout logs
export interface LogEntry extends Array<string | number> {
  0: string; // date
  1: string; // muscle group
  2: string; // exercise name
  3: number; // reps
  4: number | string; // weight (can be numeric or "Bodyweight")
  5: number; // rating
}

// Exercise definition
export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  instructions?: string;
  gifUrl?: string;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  completed: boolean;
  notes?: string;
}

// Workout template
export interface WorkoutTemplate {
  id: string; // Add this to make it consistent
  name: string;
  description?: string; // Make optional since second definition doesn't have it
  exercises: ExerciseTemplate[]; // Change to match the second definition
  createdAt?: string; // Make optional to accommodate both definitions
  lastUsed?: string;
  rowIndex?: number;
}

// Workout log
export interface WorkoutLog {
  date: string;
  startTime: string;
  endTime?: string;
  exercises: Exercise[];
  notes?: string;
  completed: boolean;
}

// User definition
export interface User {
  id: string;
  email: string;
  name?: string; // Making it optional to be consistent
  isAuthenticated: boolean;
  photoUrl?: string;
  picture?: string; // Include both photoUrl and picture for compatibility
  metrics?: UserMetrics;
  lastSync?: string;
}

export interface UserMetrics {
  height?: number;
  weight?: number;
  bodyFat?: number;
  measurements?: Record<string, number>;
  history?: MetricsHistory[];
}

export interface MetricsHistory {
  date: string;
  weight?: number;
  bodyFat?: number;
  measurements?: Record<string, number>;
}

// Pending mutation
export interface PendingMutation {
  id: string;
  timestamp: number;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }
}

// Theme colors
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  error: string;
  text: string;
  textSecondary: string;
}

// Today's workout
export interface WorkoutData {
  templateName: string;
  startTime: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutExercise {
  exercise: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: string | number;
  setsCompleted?: number;
  restTime?: number;
  notes?: string;
}

export interface TodaysWorkout {
  date: string;
  workoutData: WorkoutData;
  completed?: boolean;
  endTime?: string;
}

// Body measurements
export interface Measurements {
  date: Date | null;
  weight: string;
  neckRelaxed?: string;
  shouldersRelaxed?: string;
  chestRelaxed?: string;
  chestFlexed?: string;
  upperChestRelaxed?: string;
  lowerChestRelaxed?: string;
  leftUpperArmRelaxed?: string;
  leftUpperArmFlexed?: string;
  rightUpperArmRelaxed?: string;
  rightUpperArmFlexed?: string;
  leftForearmRelaxed?: string;
  rightForearmRelaxed?: string;
  leftWristRelaxed?: string;
  rightWristRelaxed?: string;
  waistRelaxed?: string;
  abdomenRelaxed?: string;
  hipsRelaxed?: string;
  leftUpperThighRelaxed?: string;
  rightUpperThighRelaxed?: string;
  leftMidThighRelaxed?: string;
  rightMidThighRelaxed?: string;
  leftLowerThighRelaxed?: string;
  rightLowerThighRelaxed?: string;
  leftCalvesRelaxed?: string;
  rightCalvesRelaxed?: string;
  leftAnkleRelaxed?: string;
  rightAnkleRelaxed?: string;
  [key: string]: string | Date | null | undefined;
}

// Todo item
export interface Todo {
  text: string;
  completed: boolean;
}

// UI Components Props
export interface DashboardProps {
  onNavigate: (page: string) => void;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark';
  isAuthenticated?: boolean;
  accessToken?: string | null;
  onLogout?: () => void;
  isLoading?: { [key: string]: boolean };
}

export interface PageProps extends DashboardProps {
  accessToken: string;
}

// Google API related types
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

export interface SheetResponse {
  result: {
    values?: any[][];
    [key: string]: any;
  };
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

// Application data types
export interface Workout {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  notes?: string;
  duration?: number;
  calories?: number;
}

export interface Set {
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion
}

export interface WorkoutTemplateData {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  notes?: string;
}

export interface BodyMeasurement {
  date: string;
  weight: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  notes?: string;
}

// Context interfaces
export interface AppContextState {
  user: User | null;
  isAuthenticated: boolean;
  workouts: Workout[];
  templates: WorkoutTemplate[];
  bodyMeasurements: BodyMeasurement[];
  todos: Todo[];
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

export interface AppContextActions {
  login: () => Promise<void>;
  logout: () => void;
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (id: string, workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  addTemplate: (template: WorkoutTemplate) => Promise<void>;
  updateTemplate: (id: string, template: WorkoutTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addBodyMeasurement: (measurement: BodyMeasurement) => Promise<void>;
  addTodo: (todo: Todo) => Promise<void>;
  updateTodo: (index: number, todo: Todo) => Promise<void>;
  deleteTodo: (index: number) => Promise<void>;
  toggleSidebar: () => void;
  syncData: () => Promise<void>;
}

export interface AppContextType {
  state: AppContextState;
  actions: AppContextActions;
}

// UI Component Props
export interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export interface WorkoutCardProps {
  workout: Workout;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (index: number) => void;
  onDelete: (index: number) => void;
  onEdit: (index: number, newText: string) => void;
}

export interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  textarea?: boolean;
}

export interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface ChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
  color?: string;
}

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export interface TabsProps {
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
  defaultTab?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export * from './sheetsApi';