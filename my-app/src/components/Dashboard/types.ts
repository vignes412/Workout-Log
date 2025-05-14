import { Layout as RGLLayout, Layouts as RGLLayouts } from 'react-grid-layout';

/**
 * Layout type definitions for the dashboard grid
 */
export type Layout = RGLLayout;
export type Layouts = RGLLayouts;

/**
 * Base workout log data from the database
 */
export interface WorkoutLog {
  id?: string;
  date: string | Date;
  muscleGroup?: string;
  exercise?: string;
  reps?: number;
  weight?: number;
  rating?: number;
  notes?: string;
  duration?: number;
  userId?: string;
}

/**
 * Processed workout log with formatted data for display
 */
export interface ProcessedWorkoutLog {
  date: string;
  muscleGroup: string;
  exercise: string;
  reps: number | string;
  weight: number | string;
  rating: number | string;
}

/**
 * Dashboard status card data
 */
export interface StatusCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

/**
 * Dashboard widget configuration
 */
export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  defaultLayout?: Layout;
}

/**
 * Muscle group workout distribution data
 */
export interface MuscleGroupData {
  muscleGroup: string;
  count: number;
  color: string;
}