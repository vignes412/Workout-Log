import { Measurement } from '../types';

// Defined outside the component to avoid recreation on each render
export const initialMeasurements: Measurement = {
  date: null,
  weight: "",
  neckRelaxed: "",
  shouldersRelaxed: "",
  chestRelaxed: "",
  chestFlexed: "",
  upperChestRelaxed: "",
  lowerChestRelaxed: "",
  leftUpperArmRelaxed: "",
  leftUpperArmFlexed: "",
  rightUpperArmRelaxed: "",
  rightUpperArmFlexed: "",
  leftForearmRelaxed: "",
  rightForearmRelaxed: "",
  leftWristRelaxed: "",
  rightWristRelaxed: "",
  waistRelaxed: "",
  abdomenRelaxed: "",
  hipsRelaxed: "",
  leftUpperThighRelaxed: "",
  rightUpperThighRelaxed: "",
  leftMidThighRelaxed: "",
  rightMidThighRelaxed: "",
  leftLowerThighRelaxed: "",
  rightLowerThighRelaxed: "",
  leftCalvesRelaxed: "",
  rightCalvesRelaxed: "",
  leftAnkleRelaxed: "",
  rightAnkleRelaxed: "",
};

// Type for chart colors
export const chartColors: string[] = [
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 159, 64, 0.8)',
  'rgba(153, 102, 255, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(199, 199, 199, 0.8)',
  'rgba(83, 102, 255, 0.8)',
];

// Define types for measurement groups
export type MeasurementGroup = 'upperBody' | 'arms' | 'torso' | 'legs';
export type MeasurementKey = keyof Omit<Measurement, 'date'>;

// Field groups for better organization
export const fieldGroups: Record<MeasurementGroup, MeasurementKey[]> = {
  upperBody: ["neckRelaxed", "shouldersRelaxed", "chestRelaxed", "chestFlexed", "upperChestRelaxed", "lowerChestRelaxed"],
  arms: ["leftUpperArmRelaxed", "leftUpperArmFlexed", "rightUpperArmRelaxed", "rightUpperArmFlexed", 
         "leftForearmRelaxed", "rightForearmRelaxed", "leftWristRelaxed", "rightWristRelaxed"],
  torso: ["waistRelaxed", "abdomenRelaxed", "hipsRelaxed"],
  legs: ["leftUpperThighRelaxed", "rightUpperThighRelaxed", "leftMidThighRelaxed", "rightMidThighRelaxed",
         "leftLowerThighRelaxed", "rightLowerThighRelaxed", "leftCalvesRelaxed", "rightCalvesRelaxed", 
         "leftAnkleRelaxed", "rightAnkleRelaxed"]
};

// Measurement labels to prevent recreation on each render
export const measurementLabels: Record<MeasurementKey, string> = {
  chestRelaxed: "Chest Relaxed",
  chestFlexed: "Chest Flexed",
  leftUpperArmRelaxed: "Left Upper Arm Relaxed",
  rightUpperArmRelaxed: "Right Upper Arm Relaxed",
  waistRelaxed: "Waist Relaxed",
  abdomenRelaxed: "Abdomen Relaxed",
  leftUpperThighRelaxed: "Left Upper Thigh Relaxed",
  rightUpperThighRelaxed: "Right Upper Thigh Relaxed",
  weight: "Weight",
  neckRelaxed: "Neck Relaxed",
  shouldersRelaxed: "Shoulders Relaxed",
  upperChestRelaxed: "Upper Chest Relaxed",
  lowerChestRelaxed: "Lower Chest Relaxed",
  leftUpperArmFlexed: "Left Upper Arm Flexed",
  rightUpperArmFlexed: "Right Upper Arm Flexed",
  leftForearmRelaxed: "Left Forearm Relaxed",
  rightForearmRelaxed: "Right Forearm Relaxed",
  leftWristRelaxed: "Left Wrist Relaxed",
  rightWristRelaxed: "Right Wrist Relaxed",
  hipsRelaxed: "Hips Relaxed",
  leftMidThighRelaxed: "Left Mid Thigh Relaxed",
  rightMidThighRelaxed: "Right Mid Thigh Relaxed",
  leftLowerThighRelaxed: "Left Lower Thigh Relaxed",
  rightLowerThighRelaxed: "Right Lower Thigh Relaxed",
  leftCalvesRelaxed: "Left Calves Relaxed",
  rightCalvesRelaxed: "Right Calves Relaxed",
  leftAnkleRelaxed: "Left Ankle Relaxed",
  rightAnkleRelaxed: "Right Ankle Relaxed",
};

export type SelectedMeasurements = Record<MeasurementGroup, MeasurementKey[]>;

// Default selected measurements for the chart
export const defaultSelectedMeasurements: SelectedMeasurements = {
  upperBody: ["chestRelaxed", "chestFlexed"],
  arms: ["leftUpperArmRelaxed", "rightUpperArmRelaxed"],
  torso: ["waistRelaxed", "abdomenRelaxed"],
  legs: ["leftUpperThighRelaxed", "rightUpperThighRelaxed"],
};